import WPAPI from "wpapi"

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
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url: string
      media_details?: {
        sizes?: {
          medium?: { source_url: string }
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
