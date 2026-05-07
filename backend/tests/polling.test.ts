import { cache } from '../src/utils/cache';
import { fetchFeed } from '../src/services/wordpress';
import { sendNewArticleNotification } from '../src/services/notification';
import { pollWordPressUpdates } from '../src/services/polling';

jest.mock('../src/services/wordpress', () => ({
  fetchFeed: jest.fn(),
}));

jest.mock('../src/services/notification', () => ({
  sendNewArticleNotification: jest.fn(),
}));

const cachedArticle = {
  id: '123',
  title: 'Cached Article',
  excerpt: '<p>Old excerpt</p>',
  content: '',
  thumbnailUrl: null,
  authorName: 'Author',
  publishedAt: '2026-04-16T10:00:00Z',
  modifiedAt: '2026-04-16T10:00:00Z',
  categories: ['News'],
};

const freshArticle = {
  ...cachedArticle,
  id: '456',
  title: 'Fresh Article',
  modifiedAt: '2026-04-16T11:00:00Z',
};

describe('pollWordPressUpdates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(cache, 'acquireLock').mockResolvedValue(true);
    jest.spyOn(cache, 'flushAll').mockResolvedValue();
    jest.spyOn(cache, 'set').mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not send a push when cache is missing', async () => {
    jest.spyOn(cache, 'get').mockResolvedValue(null);
    (fetchFeed as jest.Mock).mockResolvedValue({
      data: [freshArticle],
      totalPages: 1,
    });

    await pollWordPressUpdates();

    expect(cache.flushAll).toHaveBeenCalledTimes(1);
    expect(sendNewArticleNotification).not.toHaveBeenCalled();
  });

  it('sends one push when the newest article changes', async () => {
    jest.spyOn(cache, 'get').mockResolvedValue({
      data: [cachedArticle],
      totalPages: 1,
    });
    (fetchFeed as jest.Mock).mockResolvedValue({
      data: [freshArticle],
      totalPages: 1,
    });
    (sendNewArticleNotification as jest.Mock).mockResolvedValue('sent');

    await pollWordPressUpdates();

    expect(sendNewArticleNotification).toHaveBeenCalledTimes(1);
    expect(sendNewArticleNotification).toHaveBeenCalledWith(freshArticle);
  });

  it('does not send a push for edits to the current newest article', async () => {
    jest.spyOn(cache, 'get').mockResolvedValue({
      data: [cachedArticle],
      totalPages: 1,
    });
    (fetchFeed as jest.Mock).mockResolvedValue({
      data: [
        {
          ...cachedArticle,
          modifiedAt: '2026-04-16T11:00:00Z',
        },
      ],
      totalPages: 1,
    });

    await pollWordPressUpdates();

    expect(cache.flushAll).toHaveBeenCalledTimes(1);
    expect(sendNewArticleNotification).not.toHaveBeenCalled();
  });
});
