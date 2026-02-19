import React from "react"
import { TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { format } from "date-fns"

import { Text } from "./Text"
import { Post } from "../services/api/wordpress"
import { colors, spacing, typography } from "../theme"
import { decodeHtmlEntities } from "../utils/decodeHtml"

interface ArticleRowProps {
  post: Post
  onPress: (post: Post) => void
  showCategory?: boolean
}

export const ArticleRow = ({ post, onPress, showCategory = true }: ArticleRowProps) => {
  const title = decodeHtmlEntities(post.title.rendered)
  const date = format(new Date(post.date), "MMM d")

  let categoryName = ""
  if (showCategory && post._embedded?.["wp:term"]?.[0]?.[0]) {
    categoryName = decodeHtmlEntities(post._embedded["wp:term"][0][0].name)
  }

  const metadata = categoryName ? `${categoryName} • ${date}` : date

  return (
    <TouchableOpacity onPress={() => onPress(post)} style={$container}>
      <Text style={$title} text={title} />
      <Text style={$metadata} text={metadata} />
    </TouchableOpacity>
  )
}

const $container: ViewStyle = {
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
}

const $title: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 16,
  lineHeight: 20,
  color: colors.text,
  marginBottom: spacing.xxs,
}

const $metadata: TextStyle = {
  fontFamily: typography.fonts.spaceGrotesk.normal,
  fontSize: 12,
  color: colors.textDim,
}
