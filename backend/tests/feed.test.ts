import request from 'supertest';
import app from '../src/app';

// Mock fetch globally
global.fetch = jest.fn();

describe('GET /v1/feed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWpPost = {
    id: 123,
    date: '2023-10-01T12:00:00Z',
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
});
