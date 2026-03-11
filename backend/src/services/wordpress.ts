import { startOfDay, endOfDay, formatISO } from 'date-fns';
import { config } from '../utils/config';
import { ApiError } from '../middleware/errorHandler';
import { WP_CATEGORIES } from '../utils/wordpressTaxonomies';

export interface LeanArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string | null;
  authorName: string;
  publishedAt: string;
  categories: string[];
}

export interface WPPost {
  id: number;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    author?: Array<{ name: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ name: string }>>;
  };
}

const dataStripper = (posts: WPPost[]): LeanArticle[] => {
  return posts.map(post => {
    // Safe navigation using optional chaining
    const authorName = post._embedded?.author?.[0]?.name || 'Unknown Author';
    const thumbnailUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
    // Categories are typically the first array inside wp:term
    const categories = post._embedded?.['wp:term']?.[0]?.map((term: any) => term.name) || [];

    return {
      id: String(post.id),
      title: post.title.rendered,
      excerpt: post.excerpt.rendered,
      content: post.content.rendered,
      thumbnailUrl,
      authorName,
      publishedAt: post.date,
      categories
    };
  });
};

const fetchFromWP = async (queryParams: URLSearchParams): Promise<{ data: LeanArticle[], totalPages: number }> => {
  const baseUrl = config.WORDPRESS_API_BASE_URL;
  // Automatically append _embed=true to get author/media in the same request
  queryParams.set('_embed', 'true');
  
  const url = `${baseUrl}/wp-json/wp/v2/posts?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new ApiError(
        502,
        'https://api.retrogradenews.app/errors/bad-gateway',
        'Bad Gateway',
        `WordPress API responded with status ${response.status}`
      );
    }

    // Accurate Pagination via WP Headers
    let totalPages = 1;
    const totalPagesHeader = response.headers.get('X-WP-TotalPages');
    if (totalPagesHeader) {
      totalPages = parseInt(totalPagesHeader, 10);
    }

    const posts: WPPost[] = await response.json();
    const data = dataStripper(posts);

    return { data, totalPages };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      503,
      'https://api.retrogradenews.app/errors/service-unavailable',
      'Service Unavailable',
      'Could not connect to WordPress CMS'
    );
  }
};

export const fetchFeed = async (page: number = 1, limit: number = 10): Promise<{ data: LeanArticle[], totalPages: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(limit),
    categories_exclude: String(WP_CATEGORIES.ISSUE)
  });
  return fetchFromWP(params);
};

export const fetchFeedByCategory = async (categoryIds: number[], page: number = 1, limit: number = 10): Promise<{ data: LeanArticle[], totalPages: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(limit),
    categories_exclude: String(WP_CATEGORIES.ISSUE)
  });
  
  if (categoryIds && categoryIds.length > 0) {
    params.set('categories', categoryIds.join(','));
  }
  
  return fetchFromWP(params);
};

export const fetchIssues = async (page: number = 1, limit: number = 10): Promise<{ data: LeanArticle[], totalPages: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(limit),
    categories: String(WP_CATEGORIES.ISSUE)
  });
  return fetchFromWP(params);
};

export const fetchLatestIssue = async (): Promise<LeanArticle | null> => {
  const params = new URLSearchParams({
    per_page: '1',
    categories: String(WP_CATEGORIES.ISSUE)
  });
  const { data } = await fetchFromWP(params);
  return data.length > 0 ? data[0] : null;
};

export const fetchArticlesByDate = async (dateString: string): Promise<{ data: LeanArticle[], totalPages: number }> => {
  const date = new Date(dateString);
  const after = formatISO(startOfDay(date));
  const before = formatISO(endOfDay(date));

  const params = new URLSearchParams({
    after,
    before,
    categories_exclude: String(WP_CATEGORIES.ISSUE),
    per_page: '100' // Get all posts for the issue
  });
  
  return fetchFromWP(params);
};
