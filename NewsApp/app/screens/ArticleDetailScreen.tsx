import React, { useEffect, useState } from "react"
import { ActivityIndicator, ScrollView, View, ViewStyle, TextStyle, ImageStyle, useWindowDimensions, Share } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import RenderHtml from "react-native-render-html"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { AutoImage } from "../components/AutoImage"
import { Icon } from "../components/Icon"
import { Button } from "../components/Button"
import { getPost, Post } from "../services/api/wordpress"
import { colors, spacing } from "../theme"
import { AppStackParamList } from "../navigators/navigationTypes"
import { format } from "date-fns"

export const ArticleDetailScreen = ({
  route,
  navigation,
}: NativeStackScreenProps<AppStackParamList, "ArticleDetail">) => {
  const { postId, postData } = route.params
  const [post, setPost] = useState<Post | undefined>(postData)
  const [loading, setLoading] = useState(!postData)
  const { width } = useWindowDimensions()

  useEffect(() => {
    if (!post) {
      fetchPost()
    }
  }, [postId])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const fetchedPost = await getPost(postId)
      setPost(fetchedPost)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const onShare = async () => {
    try {
      await Share.share({
        message: post?.link || "",
        url: post?.link, // iOS
        title: post?.title.rendered, // Android
      })
    } catch (error) {
      console.error(error)
    }
  }

  if (loading) {
    return (
      <Screen preset="fixed" contentContainerStyle={$screenContentContainer}>
        <ActivityIndicator
          size="large"
          color={colors.palette.primary500}
          style={{ marginTop: 50 }}
        />
      </Screen>
    )
  }

  if (!post) {
    return (
      <Screen preset="fixed" contentContainerStyle={$screenContentContainer}>
        <Text text="Article not found" />
      </Screen>
    )
  }

  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url
  const authorName = post._embedded?.author?.[0]?.name

  const tagsStyles = {
    p: {
      marginBottom: 16,
      lineHeight: 28,
      fontSize: 18,
      color: colors.text,
      fontFamily: "cormorantGaramondRegular",
    },
    h1: { fontSize: 28, marginBottom: 16, fontFamily: "cormorantGaramondBold" },
    h2: { fontSize: 24, marginBottom: 16, fontFamily: "cormorantGaramondBold" },
    h3: { fontSize: 22, marginBottom: 16, fontFamily: "cormorantGaramondBold" },
    a: { color: colors.palette.primary500, textDecorationLine: "none" },
    img: { marginBottom: 16 },
    figure: { margin: 0, marginBottom: 16 },
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
    >
      <View style={$header}>
        <Button
          preset="default"
          onPress={() => navigation.goBack()}
          text="Back"
          LeftAccessory={(props) => <Icon icon="back" {...props} />}
        />
        <Button preset="filled" onPress={onShare} text="Share" />
      </View>

      <View style={$content}>
        <Text
          preset="heading"
          text={post.title.rendered
            .replace(/&#8217;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&amp;/g, "&")}
          style={$title}
        />

        <View style={$meta}>
          {authorName && <Text size="xs" style={$metaText}>{authorName}</Text>}
          {authorName && <Text size="xs" style={$metaText}> • </Text>}
          <Text size="xs" style={$metaText}>
            {format(new Date(post.date), "MMMM dd, yyyy")}
          </Text>
        </View>

        {featuredMedia && <AutoImage source={{ uri: featuredMedia }} style={$featuredImage} />}

        <RenderHtml
          contentWidth={width - 32}
          source={{ html: post.content.rendered }}
          tagsStyles={tagsStyles as any}
          systemFonts={["cormorantGaramondRegular", "cormorantGaramondBold"]}
        />
      </View>
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  paddingBottom: spacing.xl,
  backgroundColor: colors.background,
}

const $header: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
}

const $content: ViewStyle = {
  paddingHorizontal: spacing.md,
}

const $title: TextStyle = {
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
  fontSize: 32,
  lineHeight: 40,
}

const $meta: ViewStyle = {
  flexDirection: "row",
  marginBottom: spacing.md,
  alignItems: "center",
}

const $metaText: TextStyle = {
  color: colors.textDim,
  fontFamily: "cormorantGaramondRegular",
}

const $featuredImage: ImageStyle = {
  width: "100%",
  height: 220,
  borderRadius: 8,
  marginBottom: spacing.md,
}
