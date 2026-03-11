"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFeed = void 0;
const config_1 = require("../utils/config");
const errorHandler_1 = require("../middleware/errorHandler");
const fetchFeed = async (page, limit) => {
    const baseUrl = config_1.config.WORDPRESS_API_BASE_URL;
    // Automatically append _embed=true to get author/media in the same request
    const url = `${baseUrl}/wp-json/wp/v2/posts?_embed=true&categories_exclude=1407&page=${page}&per_page=${limit}`;
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
        // Data Stripper
        const data = posts.map(post => {
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
                categories
            };
        });
        return { data, totalPages };
    }
    catch (error) {
        if (error instanceof errorHandler_1.ApiError)
            throw error;
        throw new errorHandler_1.ApiError(503, 'https://api.retrogradenews.app/errors/service-unavailable', 'Service Unavailable', 'Could not connect to WordPress CMS');
    }
};
exports.fetchFeed = fetchFeed;
