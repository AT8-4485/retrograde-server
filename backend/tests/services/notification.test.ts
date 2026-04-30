import { prisma } from '../../src/utils/db';
import { sendPushNotification } from '../../src/services/expoPush';
import { sendNewArticleNotification } from '../../src/services/notification';
import type { LeanArticle } from '../../src/services/wordpress';

jest.mock('../../src/services/expoPush', () => ({
  sendPushNotification: jest.fn(),
}));

const article: LeanArticle = {
  id: '123',
  title: '<strong>New Article</strong>',
  excerpt: '<p>A useful excerpt &amp; summary.</p>',
  content: '',
  thumbnailUrl: null,
  authorName: 'Author',
  publishedAt: '2026-04-16T10:00:00Z',
  modifiedAt: '2026-04-16T10:00:00Z',
  categories: ['News'],
};

describe('notification service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends a new article notification to active tokens once', async () => {
    await prisma.pushToken.create({
      data: {
        id: 'push-token-id',
        token: 'ExponentPushToken[service-token]',
        platform: 'ios',
      },
    });

    const firstResult = await sendNewArticleNotification(article);
    const secondResult = await sendNewArticleNotification(article);

    expect(firstResult).toBe('sent');
    expect(secondResult).toBe('duplicate');
    expect(sendPushNotification).toHaveBeenCalledTimes(1);
    expect(sendPushNotification).toHaveBeenCalledWith(
      ['ExponentPushToken[service-token]'],
      'New Article',
      'A useful excerpt & summary.',
      { type: 'article', postId: '123' }
    );
  });

  it('records the dispatch even when no tokens exist', async () => {
    const result = await sendNewArticleNotification(article);

    expect(result).toBe('no-tokens');
    expect(sendPushNotification).not.toHaveBeenCalled();

    const dispatch = await prisma.notificationDispatch.findUnique({
      where: {
        articleId_type: {
          articleId: '123',
          type: 'new_article',
        },
      },
    });
    expect(dispatch).toBeTruthy();
  });
});
