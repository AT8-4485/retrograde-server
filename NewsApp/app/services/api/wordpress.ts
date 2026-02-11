import WPAPI from "wpapi"
import { startOfDay, endOfDay, formatISO } from "date-fns"

// Initialize WPAPI with the endpoint
const wp = new WPAPI({ endpoint: "https://retrogradenews.com/wp-json" })

export interface Post {
  id: number
  date: string
  slug: string
  link: string
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  categories: number[]
  tags: number[]
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string
      media_details?: {
        sizes?: {
          medium?: { source_url: string }
          large?: { source_url: string }
          medium_large?: { source_url: string }
          full?: { source_url: string }
          thumbnail?: { source_url: string }
        }
      }
    }>
    author?: Array<{
      name: string
      avatar_urls?: {
        "24"?: string
        "48"?: string
        "96"?: string
      }
    }>
    "wp:term"?: Array<
      Array<{
        id: number
        name: string
        slug: string
        taxonomy: string
      }>
    >
  }
}

/**
 * Fetches a list of posts from the WordPress API.
 * @param page The page number to fetch.
 * @param perPage The number of posts per page.
 * @returns A promise that resolves to an array of posts.
 */
export const getPosts = async (page = 1, perPage = 10): Promise<Post[]> => {
  try {
    // wp.posts() returns a request object. calling .embed() adds the _embed param.
    const posts = await wp.posts().page(page).perPage(perPage).embed()
    return posts
  } catch (error) {
    console.error("Error fetching posts:", error)
    throw error
  }
}

/**
 * Fetches a single post by ID.
 * @param id The ID of the post to fetch.
 * @returns A promise that resolves to the post.
 */
export const getPost = async (id: number): Promise<Post> => {
  try {
    const post = await wp.posts().id(id).embed()
    return post
  } catch (error) {
    console.error("Error fetching post:", error)
    throw error
  }
}

/**
 * Fetches the latest issue post (from category 1407).
 * @returns A promise that resolves to the latest issue post or null.
 */
export const getLatestIssue = async (): Promise<Post | null> => {
  try {
    const posts = await wp.posts().categories(1407).perPage(1).embed()
    if (posts.length > 0) {
      return posts[0]
    }
    return null
  } catch (error) {
    console.error("Error fetching latest issue:", error)
    throw error
  }
}

/**
 * Fetches all posts for a specific issue date.
 * @param dateString The date string of the issue.
 * @returns A promise that resolves to an array of posts for that day.
 */
export const getPostsByDate = async (dateString: string): Promise<Post[]> => {
  try {
    const date = new Date(dateString)
    const after = formatISO(startOfDay(date))
    const before = formatISO(endOfDay(date))

    const posts = await wp
      .posts()
      .after(after)
      .before(before)
      .excludeCategories([1407]) // Exclude the issue post itself
      .perPage(100) // Get all posts for the issue
      .embed()

    return posts
  } catch (error) {
    console.error("Error fetching posts by date:", error)
    throw error
  }
}

/**
 * Fetches a list of issue posts (from category 1407).
 * @param page The page number to fetch.
 * @param perPage The number of posts per page.
 * @returns A promise that resolves to an array of issue posts.
 */
export const getIssues = async (page = 1, perPage = 10): Promise<Post[]> => {
  try {
    const posts = await wp.posts().categories(1407).page(page).perPage(perPage).embed()
    return posts
  } catch (error) {
    console.error("Error fetching issues:", error)
    throw error
  }
}
