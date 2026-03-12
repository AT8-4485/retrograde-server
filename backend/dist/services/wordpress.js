"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchArticlesByDate = exports.fetchLatestIssue = exports.fetchIssues = exports.fetchFeedByCategory = exports.fetchFeed = void 0;
const date_fns_1 = require("date-fns");
const config_1 = require("../utils/config");
const errorHandler_1 = require("../middleware/errorHandler");
const wordpressTaxonomies_1 = require("../utils/wordpressTaxonomies");
const cache_1 = require("../utils/cache");
const dataStripper = (posts) => {
    return posts.map(post => {
        // Safe navigation using optional chaining
        const authorName = post._embedded?.author?.[0]?.name || 'Unknown Author';
        const thumbnailUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;
        // Categories are typically the first array inside wp:term
        const categories = post._embedded?.['wp:term']?.[0]?.map((term) => term.name) || [];
        return {
            id: String(post.id),
            title: post.title.rendered,
            excerpt: post.excerpt.rendered,
            content: post.content.rendered,
            thumbnailUrl,
            authorName,
            publishedAt: post.date,
            modifiedAt: post.modified,
            categories
        };
    });
};
const fetchFromWP = async (queryParams, bypassCache = false) => {
    const baseUrl = config_1.config.WORDPRESS_API_BASE_URL;
    // Automatically append _embed=true to get author/media in the same request
    queryParams.set('_embed', 'true');
    const cacheKey = `wp_${queryParams.toString()}`;
    if (!bypassCache) {
        const cachedData = cache_1.cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
    }
    const url = `${baseUrl}/wp-json/wp/v2/posts?${queryParams.toString()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new errorHandler_1.ApiError(502, 'https://api.retrogradenews.app/errors/bad-gateway', 'Bad Gateway', `WordPress API responded with status ${response.status}`);
        }
        // Accurate Pagination via WP Headers
        let totalPages = 1;
        const totalPagesHeader = response.headers.get('X-WP-TotalPages');
        if (totalPagesHeader) {
            totalPages = parseInt(totalPagesHeader, 10);
        }
        const posts = await response.json();
        const data = dataStripper(posts);
        const payload = { data, totalPages };
        cache_1.cache.set(cacheKey, payload);
        return payload;
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError)
            throw error;
        throw new errorHandler_1.ApiError(503, 'https://api.retrogradenews.app/errors/service-unavailable', 'Service Unavailable', 'Could not connect to WordPress CMS');
    }
};
const fetchFeed = async (page = 1, limit = 10, bypassCache = false) => {
    const params = new URLSearchParams({
        page: String(page),
        per_page: String(limit),
        categories_exclude: String(wordpressTaxonomies_1.WP_CATEGORIES.ISSUE)
    });
    return fetchFromWP(params, bypassCache);
};
exports.fetchFeed = fetchFeed;
const fetchFeedByCategory = async (categoryIds, page = 1, limit = 10) => {
    const params = new URLSearchParams({
        page: String(page),
        per_page: String(limit),
        categories_exclude: String(wordpressTaxonomies_1.WP_CATEGORIES.ISSUE)
    });
    if (categoryIds && categoryIds.length > 0) {
        params.set('categories', categoryIds.join(','));
    }
    return fetchFromWP(params);
};
exports.fetchFeedByCategory = fetchFeedByCategory;
const fetchIssues = async (page = 1, limit = 10) => {
    const params = new URLSearchParams({
        page: String(page),
        per_page: String(limit),
        categories: String(wordpressTaxonomies_1.WP_CATEGORIES.ISSUE)
    });
    return fetchFromWP(params);
};
exports.fetchIssues = fetchIssues;
const fetchLatestIssue = async () => {
    const params = new URLSearchParams({
        per_page: '1',
        categories: String(wordpressTaxonomies_1.WP_CATEGORIES.ISSUE)
    });
    const { data } = await fetchFromWP(params);
    return data.length > 0 ? data[0] : null;
};
exports.fetchLatestIssue = fetchLatestIssue;
const fetchArticlesByDate = async (dateString) => {
    const date = new Date(dateString);
    const after = (0, date_fns_1.formatISO)((0, date_fns_1.startOfDay)(date));
    const before = (0, date_fns_1.formatISO)((0, date_fns_1.endOfDay)(date));
    const params = new URLSearchParams({
        after,
        before,
        categories_exclude: String(wordpressTaxonomies_1.WP_CATEGORIES.ISSUE),
        per_page: '100' // Get all posts for the issue
    });
    return fetchFromWP(params);
};
exports.fetchArticlesByDate = fetchArticlesByDate;
