import React from "react"
import { ImageStyle, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { format } from "date-fns"
import { Post } from "../services/api/wordpress"
import { Text } from "./Text"
import { AutoImage } from "./AutoImage"
import { colors, spacing, typography } from "../theme"
import { decodeHtmlEntities } from "../utils/decodeHtml"

interface ArticleMediumProps {
  post: Post
  onPress: (post: Post) => void
  showCategory?: boolean
  imageStyle?: ImageStyle
}

export const ArticleMedium = ({
  post,
  onPress,
  showCategory = true,
  imageStyle,
}: ArticleMediumProps) => {
  const title = decodeHtmlEntities(post.title.rendered)
  const date = format(new Date(post.date), "MMM d")

  let categoryName = ""
  if (showCategory && post._embedded?.["wp:term"]?.[0]?.[0]) {
    categoryName = post._embedded["wp:term"][0][0].name
  }

  const metadata = categoryName ? `${categoryName} • ${date}` : date

  const featuredMedia =
    post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.thumbnail?.source_url ||
    post._embedded?.["wp:featuredmedia"]?.[0]?.source_url

  return (
    <TouchableOpacity onPress={() => onPress(post)} style={$container}>
      {featuredMedia && (
        <AutoImage source={{ uri: featuredMedia }} style={[$thumbnail, imageStyle]} />
      )}
      <View style={$textContainer}>
        <Text style={$title} text={title} numberOfLines={3} />
        <Text style={$metadata} text={metadata} />
      </View>
    </TouchableOpacity>
  )
}

const $container: ViewStyle = {
  flexDirection: "row",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  alignItems: "flex-start",
}

const $thumbnail: ImageStyle = {
  width: 100,
  height: 80, // slightly wider to match typical article thumbnails
  borderRadius: 4,
  marginRight: spacing.md,
  backgroundColor: colors.palette.neutral300,
}

const $textContainer: ViewStyle = {
  flex: 1,
  justifyContent: "space-between",
  minHeight: 80,
}

const $title: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 18,
  lineHeight: 22,
  color: colors.text,
  marginBottom: spacing.xs,
}

const $metadata: TextStyle = {
  fontFamily: typography.fonts.spaceGrotesk.normal,
  fontSize: 12,
  color: colors.textDim,
}
