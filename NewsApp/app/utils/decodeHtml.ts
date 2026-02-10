import { decode } from "he"

export function decodeHtmlEntities(text: string): string {
  if (!text) return ""

  // 1. Decode HTML entities first (e.g. &lt;h2&gt; -> <h2>)
  let decoded = decode(text)

  // 2. Strip HTML tags (e.g. <h2>Title</h2> -> Title)
  decoded = decoded.replace(/<[^>]+>/g, "")

  // 3. Decode again in case stripping tags revealed more entities or if entities were double encoded
  decoded = decode(decoded)

  return decoded.trim()
}
