import { config } from '../utils/config';
import { ApiError } from '../middleware/errorHandler';

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

export const fetchFeed = async (page: number, limit: number): Promise<{ data: LeanArticle[], totalPages: number }> => {
  const baseUrl = config.WORDPRESS_API_BASE_URL;
  // Automatically append _embed=true to get author/media in the same request
  const url = `${baseUrl}/wp-json/wp/v2/posts?_embed=true&categories_exclude=1407&page=${page}&per_page=${limit}`;

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
    console.log(JSON.stringify(posts[0], null, 2));

    // Data Stripper
    const data: LeanArticle[] = posts.map(post => {
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


