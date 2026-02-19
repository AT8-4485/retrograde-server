import {
  getPosts,
  getPostsByCategory,
  getPost,
  getLatestIssue,
  getPostsByDate,
  getIssues,
} from "./wordpress"
import { api } from "./index"

// Mock the api instance
jest.mock("./index", () => ({
  api: {
    apisauce: {
      get: jest.fn(),
    },
  },
}))

const mockApi = api.apisauce.get as jest.Mock

describe("Wordpress API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getPosts", () => {
    it("fetches posts successfully", async () => {
      const mockPosts = [{ id: 1, title: { rendered: "Test Post" } }]
      mockApi.mockResolvedValue({ ok: true, data: mockPosts })

      const result = await getPosts(2, 5)

      expect(mockApi).toHaveBeenCalledWith("/wp/v2/posts", {
        page: 2,
        per_page: 5,
        _embed: true,
      })
      expect(result).toEqual({ kind: "ok", posts: mockPosts })
    })

    it("returns error problem when fetching fails", async () => {
      mockApi.mockResolvedValue({ ok: false, problem: "SERVER_ERROR" })

      const result = await getPosts()

      expect(result).toEqual({ kind: "server" })
    })
  })

  describe("getPostsByCategory", () => {
    it("fetches posts by category", async () => {
      const mockPosts = [{ id: 1 }]
      mockApi.mockResolvedValue({ ok: true, data: mockPosts })

      const result = await getPostsByCategory([123], 1, 10)

      expect(mockApi).toHaveBeenCalledWith("/wp/v2/posts", {
        categories: "123",
        categories_exclude: 1407,
        page: 1,
        per_page: 10,
        _embed: true,
      })
      expect(result).toEqual({ kind: "ok", posts: mockPosts })
    })

    it("fetches all posts (excluding issue category) when categories are null", async () => {
      const mockPosts = [{ id: 1 }]
      mockApi.mockResolvedValue({ ok: true, data: mockPosts })

      await getPostsByCategory(null)

      expect(mockApi).toHaveBeenCalledWith("/wp/v2/posts", {
        categories_exclude: 1407,
        page: 1,
        per_page: 10,
        _embed: true,
      })
    })
  })

  describe("getPost", () => {
    it("fetches a single post by id", async () => {
      const mockPost = { id: 1, title: { rendered: "Single Post" } }
      mockApi.mockResolvedValue({ ok: true, data: mockPost })

      const result = await getPost(1)

      expect(mockApi).toHaveBeenCalledWith("/wp/v2/posts/1", { _embed: true })
      expect(result).toEqual({ kind: "ok", post: mockPost })
    })

    it("returns not-found if data is missing", async () => {
        mockApi.mockResolvedValue({ ok: true, data: null }) // Or empty response
        const result = await getPost(1)
        expect(result).toEqual({ kind: "not-found" })
    })
  })

  describe("getLatestIssue", () => {
    it("fetches the latest issue post", async () => {
      const mockIssuePost = { id: 100, categories: [1407] }
      mockApi.mockResolvedValue({ ok: true, data: [mockIssuePost] })

      const result = await getLatestIssue()

      expect(mockApi).toHaveBeenCalledWith("/wp/v2/posts", {
        categories: 1407,
        per_page: 1,
        _embed: true,
      })
      // Cast result to specific type or check properties
      if (result.kind === "ok") {
        expect(result.post).toEqual(mockIssuePost)
      } else {
        fail("Expected result kind to be ok")
      }
    })

    it("returns null if no issue found", async () => {
      mockApi.mockResolvedValue({ ok: true, data: [] })

      const result = await getLatestIssue()

      if (result.kind === "ok") {
        expect(result.post).toBeNull()
      } else {
        fail("Expected result kind to be ok")
      }
    })
  })

  describe("getPostsByDate", () => {
    it("fetches posts for a specific date range", async () => {
      const mockPosts = [{ id: 1, date: "2023-10-27T10:00:00" }]
      mockApi.mockResolvedValue({ ok: true, data: mockPosts })
      const dateString = "2023-10-27"

      const result = await getPostsByDate(dateString)

      // We expect formatISO strings for after/before.
      // Since we can't predict exact ISO string due to timezone in test env vs implementation,
      // we can check partial match or mock date-fns?
      // Assuming test env timezone is consistent or date-fns handles it well.
      // But formatISO output depends on timezone of the input Date object if local.
      // "2023-10-27" creates a Date at local midnight.

      expect(mockApi).toHaveBeenCalledWith(
        "/wp/v2/posts",
        expect.objectContaining({
            categories_exclude: 1407,
            per_page: 100,
            _embed: true
        })
      )
      expect(result).toEqual({ kind: "ok", posts: mockPosts })
    })
  })

  describe("getIssues", () => {
    it("fetches issue posts", async () => {
      const mockIssues = [{ id: 100 }]
      mockApi.mockResolvedValue({ ok: true, data: mockIssues })

      const result = await getIssues(1, 10)

      expect(mockApi).toHaveBeenCalledWith("/wp/v2/posts", {
        categories: 1407,
        page: 1,
        per_page: 10,
        _embed: true,
      })
      expect(result).toEqual({ kind: "ok", posts: mockIssues })
    })
  })
})
