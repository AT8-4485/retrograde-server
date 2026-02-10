import { decode } from "he"

export function decodeHtmlEntities(text: string): string {
  if (!text) return ""
  // First remove HTML tags if any, then decode entities
  const textWithoutTags = text.replace(/<[^>]+>/g, "")
  return decode(textWithoutTags)
}
