import { startOfDay, endOfDay, formatISO } from "date-fns"
import { api } from "./index"
import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"

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
    "author"?: Array<{
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

export type GetPostsResult = { kind: "ok"; posts: Post[] } | GeneralApiProblem
export type GetPostResult = { kind: "ok"; post: Post } | GeneralApiProblem
export type GetLatestIssueResult = { kind: "ok"; post: Post | null } | GeneralApiProblem

/**
 * Fetches a list of posts from the WordPress API.
 * @param page The page number to fetch.
 * @param perPage The number of posts per page.
 * @returns A promise that resolves to a result object.
 */
export const getPosts = async (page = 1, perPage = 10): Promise<GetPostsResult> => {
  const response = await api.apisauce.get<Post[]>("/wp/v2/posts", {
    page,
    per_page: perPage,
    _embed: true,
  })

  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  const posts = response.data
  return { kind: "ok", posts: posts || [] }
}

/**
 * Fetches posts filtered by category IDs.
 * @param categoryIds Array of category IDs to include. If null or empty, fetches all posts (excluding issues).
 * @param page The page number.
 * @param perPage Number of posts per page.
 * @returns A promise resolving to a result object.
 */
export const getPostsByCategory = async (
  categoryIds: number[] | null,
  page = 1,
  perPage = 10,
): Promise<GetPostsResult> => {
  const params: Record<string, any> = {
    page,
    per_page: perPage,
    _embed: true,
    categories_exclude: 1407, // Always exclude the issue container category
  }

  if (categoryIds && categoryIds.length > 0) {
    params.categories = categoryIds.join(",")
  }

  const response = await api.apisauce.get<Post[]>("/wp/v2/posts", params)

  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  const posts = response.data
  return { kind: "ok", posts: posts || [] }
}

/**
 * Fetches a single post by ID.
 * @param id The ID of the post to fetch.
 * @returns A promise that resolves to a result object.
 */
export const getPost = async (id: number): Promise<GetPostResult> => {
  const response = await api.apisauce.get<Post>(`/wp/v2/posts/${id}`, { _embed: true })

  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  const post = response.data
  if (!post) {
      return { kind: "not-found" }
  }
  return { kind: "ok", post }
}

/**
 * Fetches the latest issue post (from category 1407).
 * @returns A promise that resolves to the latest issue post or null.
 */
export const getLatestIssue = async (): Promise<GetLatestIssueResult> => {
  const response = await api.apisauce.get<Post[]>("/wp/v2/posts", {
    categories: 1407,
    per_page: 1,
    _embed: true,
  })

  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  const posts = response.data
  if (posts && posts.length > 0) {
    return { kind: "ok", post: posts[0] }
  }
  return { kind: "ok", post: null }
}

/**
 * Fetches all posts for a specific issue date.
 * @param dateString The date string of the issue.
 * @returns A promise that resolves to a result object with posts for that day.
 */
export const getPostsByDate = async (dateString: string): Promise<GetPostsResult> => {
  const date = new Date(dateString)
  const after = formatISO(startOfDay(date))
  const before = formatISO(endOfDay(date))

  const response = await api.apisauce.get<Post[]>("/wp/v2/posts", {
    after,
    before,
    categories_exclude: 1407, // Exclude the issue post itself
    per_page: 100, // Get all posts for the issue
    _embed: true,
  })

  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  const posts = response.data
  return { kind: "ok", posts: posts || [] }
}

/**
 * Fetches a list of issue posts (from category 1407).
 * @param page The page number to fetch.
 * @param perPage The number of posts per page.
 * @returns A promise that resolves to a result object.
 */
export const getIssues = async (page = 1, perPage = 10): Promise<GetPostsResult> => {
  const response = await api.apisauce.get<Post[]>("/wp/v2/posts", {
    categories: 1407,
    page,
    per_page: perPage,
    _embed: true,
  })

  if (!response.ok) {
    const problem = getGeneralApiProblem(response)
    if (problem) return problem
  }

  const posts = response.data
  return { kind: "ok", posts: posts || [] }
}
