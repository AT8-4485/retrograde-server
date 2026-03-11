/**
 * WordPress taxonomy IDs used throughout the app.
 * Update these if the IDs change on the WordPress backend.
 */

/** WordPress category IDs */
export const WP_CATEGORIES = {
  NEWS: 1363,
  BREAKING_NEWS: 1469,
  OPINION: 1364,
  /** Secondary opinion sub-category */
  OPINION_SUB: 1454,
  LIFE_ARTS: 1365,
  COMICS: 1366,
  /** The "Issue" container category - used to group posts into issues */
  ISSUE: 1407,
} as const

/** WordPress tag IDs */
export const WP_TAGS = {
  /** Top-tier: shown as the hero article on the main page */
  HIGHLIGHT: 1468,
  /** Second-tier: marks an article as featured */
  FEATURED: 1464,
} as const
