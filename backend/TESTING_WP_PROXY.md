# Testing the WordPress Content Proxy

This guide explains how to test the Phase 1.3 WordPress Content Proxy functionality locally to see exactly what the backend is fetching from the CMS and how it transforms it.

## 1. Start the Development Server

Open a terminal in the `backend` directory and run the following command to start the server with hot-reloading:

```bash
npm run dev
```

You should see log output indicating the server has started (typically on port 3000).

## 2. Test the API Output (The Transformed Data)

To see the *stripped and cleaned* data that the mobile client will receive, open a new terminal tab and use `curl` (or an app like Postman / Insomnia):

```bash
curl -s "http://localhost:3000/v1/feed?cursor=1&limit=2" | jq
```
*(Note: If you don't have `jq` installed on your machine, you can omit `| jq` or use a browser).*

**What you will see:** A JSON response following the standard Pagination Envelope containing `data` (an array of `LeanArticle` objects), `cursor` (the next page number), and `hasMore`.

## 3. How to See the RAW WordPress Data

If you want to verify exactly what `wordpress.ts` is retrieving from the WordPress API *before* it strips out the bloat, you can temporarily add a `console.log` to the service.

1. Open `src/services/wordpress.ts`.
2. Locate the `fetchFeed` function.
3. Right below `const posts: WPPost[] = await response.json();`, add the following line:

```typescript
// Add this line to log the first raw post to your terminal!
console.log(JSON.stringify(posts[0], null, 2));
```

4. Save the file. The dev server will automatically restart.
5. Hit the endpoint again using `curl "http://localhost:3000/v1/feed?limit=1"`.
6. Look at the terminal running your server. You will now see the massive, deeply nested raw WordPress JSON payload (including the `_embedded` array) printed out!

*Remember to remove the `console.log` when you're done inspecting the payload!*
