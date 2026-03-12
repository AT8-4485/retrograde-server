import request from 'supertest';
import app from '../src/app';
import { cache } from '../src/utils/cache';

// Mock fetch globally
global.fetch = jest.fn();

describe('GET /v1/feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.flushAll(); // Ensure cache is clean for every test
  });

  const mockWpPost = {
    id: 123,
    date: '2023-10-01T12:00:00Z',
    modified: '2023-10-02T12:00:00Z',
    title: { rendered: 'Test Post' },
    excerpt: { rendered: '<p>Test excerpt</p>' },
    content: { rendered: '<p>Test content</p>' },
    _embedded: {
      author: [{ name: 'Test Author' }],
      'wp:featuredmedia': [{ source_url: 'https://example.com/image.jpg' }],
      'wp:term': [[{ name: 'News' }, { name: 'Update' }]]
    }
  };

  it('should return a stripped pagination envelope', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'X-WP-TotalPages': '3' }),
      json: async () => [mockWpPost]
    });

    const res = await request(app).get('/v1/feed?cursor=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.cursor).toBe('2');
    expect(res.body.data).toHaveLength(1);
    
    const article = res.body.data[0];
    expect(article.id).toBe('123'); // Cast to string
    expect(article.title).toBe('Test Post');
    expect(article.authorName).toBe('Test Author');
    expect(article.thumbnailUrl).toBe('https://example.com/image.jpg');
    expect(article.categories).toEqual(['News', 'Update']);
  });

  it('should handle last page correctly (hasMore: false)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'X-WP-TotalPages': '1' }),
      json: async () => [mockWpPost]
    });

    const res = await request(app).get('/v1/feed?cursor=1&limit=10');

    expect(res.status).toBe(200);
    expect(res.body.hasMore).toBe(false);
    expect(res.body.cursor).toBeNull();
  });

  it('should return 502 Bad Gateway if WP API returns non-200', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Headers()
    });

    const res = await request(app).get('/v1/feed');

    expect(res.status).toBe(502);
    expect(res.body.type).toBe('https://api.retrogradenews.app/errors/bad-gateway');
  });

  it('should return 503 Service Unavailable if fetch fails completely', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const res = await request(app).get('/v1/feed');

    expect(res.status).toBe(503);
    expect(res.body.type).toBe('https://api.retrogradenews.app/errors/service-unavailable');
  });

  it('should hit the cache on subsequent requests', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'X-WP-TotalPages': '1' }),
      json: async () => [mockWpPost]
    });

    // First request - should call fetch
    await request(app).get('/v1/feed?cursor=1&limit=10');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second request - should hit cache
    const res2 = await request(app).get('/v1/feed?cursor=1&limit=10');
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1!
    expect(res2.status).toBe(200);
    expect(res2.body.data).toHaveLength(1);
    expect(res2.body.data[0].id).toBe('123');
  });
});

describe('GET /v1/feed/category', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.flushAll(); // Flush cache for these tests too
  });

  const mockWpPost = {
    id: 124,
    date: '2023-10-02T12:00:00Z',
    modified: '2023-10-02T12:00:00Z',
    title: { rendered: 'Category Post' },
    excerpt: { rendered: '<p>Cat excerpt</p>' },
    content: { rendered: '<p>Cat content</p>' },
    _embedded: {}
  };

  it('should return posts filtered by category', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'X-WP-TotalPages': '1' }),
      json: async () => [mockWpPost]
    });

    const res = await request(app).get('/v1/feed/category?categories=1363,1364');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe('124');
    
    // Ensure the fetch URL contains the category ids
    const fetchCallUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(fetchCallUrl).toContain('categories=1363%2C1364');
  });

  it('should fail if no categories are provided', async () => {
    const res = await request(app).get('/v1/feed/category');
    expect(res.status).toBe(400);
  });
});

describe('GET /v1/feed/issues/latest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.flushAll(); // Flush cache for these tests
  });

  const mockIssuePost = {
    id: 999,
    date: '2023-10-15T12:00:00Z',
    modified: '2023-10-15T12:00:00Z',
    title: { rendered: 'October Issue' },
    excerpt: { rendered: '' },
    content: { rendered: '' },
    _embedded: {}
  };

  const mockArticlePost = {
    id: 1000,
    date: '2023-10-15T14:00:00Z',
    modified: '2023-10-15T14:00:00Z',
    title: { rendered: 'Issue Article' },
    excerpt: { rendered: '' },
    content: { rendered: '' },
    _embedded: {}
  };

  it('should dual-fetch issue and articles', async () => {
    // First call is fetchLatestIssue, second is fetchArticlesByDate
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'X-WP-TotalPages': '1' }),
        json: async () => [mockIssuePost]
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'X-WP-TotalPages': '1' }),
        json: async () => [mockArticlePost]
      });

    const res = await request(app).get('/v1/feed/issues/latest');

    expect(res.status).toBe(200);
    expect(res.body.issue).toBeDefined();
    expect(res.body.issue.id).toBe('999');
    expect(res.body.articles).toHaveLength(1);
    expect(res.body.articles[0].id).toBe('1000');

    // Verify correct endpoints were called
    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls.length).toBe(2);
    expect(calls[0][0]).toContain('categories=1407'); // WP_CATEGORIES.ISSUE
    expect(calls[1][0]).toContain('after=');
    expect(calls[1][0]).toContain('before=');
  });

  it('should return null issue if none found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'X-WP-TotalPages': '1' }),
      json: async () => []
    });

    const res = await request(app).get('/v1/feed/issues/latest');

    expect(res.status).toBe(200);
    expect(res.body.issue).toBeNull();
    expect(res.body.articles).toEqual([]);
  });
});
