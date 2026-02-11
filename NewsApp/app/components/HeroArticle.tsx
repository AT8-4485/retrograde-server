import React from "react"
import { Dimensions, ImageStyle, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { format } from "date-fns"
import { Post } from "../services/api/wordpress"
import { Text } from "./Text"
import { AutoImage } from "./AutoImage"
import { colors, spacing, typography } from "../theme"
import { decodeHtmlEntities } from "../utils/decodeHtml"

interface HeroArticleProps {
  post: Post
  onPress: (post: Post) => void
  showCategory?: boolean
}

const SCREEN_WIDTH = Dimensions.get("window").width

export const HeroArticle = ({ post, onPress, showCategory = true }: HeroArticleProps) => {
  const title = decodeHtmlEntities(post.title.rendered)
  // Remove HTML tags from excerpt for cleaner display if decodeHtmlEntities doesn't do it fully (it does strip tags)
  const excerpt = decodeHtmlEntities(post.excerpt.rendered)
  const date = format(new Date(post.date), "MMM d")

  let categoryName = ""
  if (showCategory && post._embedded?.["wp:term"]?.[0]?.[0]) {
    categoryName = decodeHtmlEntities(post._embedded["wp:term"][0][0].name)
  }

  const metadata = categoryName ? `${categoryName} • ${date}` : date

  // Try to find a larger image for the hero
  const mediaSizes = post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes
  const featuredMedia =
    mediaSizes?.large?.source_url ||
    mediaSizes?.medium_large?.source_url ||
    mediaSizes?.full?.source_url ||
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url

  return (
    <TouchableOpacity onPress={() => onPress(post)} style={$container}>
      {featuredMedia && <AutoImage source={{ uri: featuredMedia }} style={$image} />}
      <View style={$contentContainer}>
        <Text style={$title} text={title} />
        {!!excerpt && <Text style={$excerpt} text={excerpt} numberOfLines={2} />}
        <Text style={$metadata} text={metadata} />
      </View>
    </TouchableOpacity>
  )
}

const $container: ViewStyle = {
  marginBottom: spacing.md,
}

const $image: ImageStyle = {
  width: SCREEN_WIDTH,
  height: SCREEN_WIDTH * 0.6, // Aspect ratio ~ 3:2
  backgroundColor: colors.palette.neutral300,
}

const $contentContainer: ViewStyle = {
  paddingHorizontal: spacing.md,
  paddingTop: spacing.sm,
}

const $title: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 24,
  lineHeight: 28,
  color: colors.text,
  marginBottom: spacing.xs,
}

const $excerpt: TextStyle = {
  fontFamily: typography.secondary?.normal,
  fontSize: 14,
  lineHeight: 20,
  color: colors.textDim,
  marginBottom: spacing.xs,
}

const $metadata: TextStyle = {
  fontFamily: typography.fonts.spaceGrotesk.normal,
  fontSize: 12,
  color: colors.textDim,
  marginTop: spacing.xxs,
}
