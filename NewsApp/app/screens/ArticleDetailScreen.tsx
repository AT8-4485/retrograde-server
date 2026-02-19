import React, { useEffect, useState } from "react"
import {
  ActivityIndicator,
  ScrollView,
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  useWindowDimensions,
  Share,
} from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { format } from "date-fns"
import RenderHtml from "react-native-render-html"

import { AutoImage } from "../components/AutoImage"
import { Button } from "../components/Button"
import { Icon } from "../components/Icon"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { AppStackParamList } from "../navigators/navigationTypes"
import { getPost, Post } from "../services/api/wordpress"
import { colors, spacing } from "../theme"
import { decodeHtmlEntities } from "../utils/decodeHtml"

export const ArticleDetailScreen = ({
  route,
  navigation,
}: NativeStackScreenProps<AppStackParamList, "ArticleDetail">) => {
  const { postId, postData } = route.params
  const [post, setPost] = useState<Post | undefined>(postData)
  const [loading, setLoading] = useState(!postData)
  const [error, setError] = useState<string | null>(null)
  const { width } = useWindowDimensions()

  useEffect(() => {
    if (!post) {
      fetchPost()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  const fetchPost = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getPost(postId)
      if (result.kind === "ok") {
        setPost(result.post)
      } else if (result.kind === "not-found") {
        setError("Article not found.")
      } else {
        setError("Unable to load article.")
      }
    } catch (e) {
      console.error(e)
      setError("An unexpected error occurred.")
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

  if (error) {
    return (
      <Screen preset="fixed" contentContainerStyle={$errorContainer}>
        <Text text={error} style={$errorText} />
        <Button text="Go Back" onPress={() => navigation.goBack()} preset="filled" />
      </Screen>
    )
  }

  if (!post) {
    return (
      <Screen preset="fixed" contentContainerStyle={$errorContainer}>
        <Text text="Article not found" style={$errorText} />
        <Button text="Go Back" onPress={() => navigation.goBack()} preset="filled" />
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
        <Text preset="heading" text={decodeHtmlEntities(post.title.rendered)} style={$title} />

        <View style={$meta}>
          {authorName && (
            <Text size="xs" style={$metaText}>
              {authorName}
            </Text>
          )}
          {authorName && (
            <Text size="xs" style={$metaText}>
              {" "}
              •{" "}
            </Text>
          )}
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

const $errorContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
  backgroundColor: colors.background,
}

const $errorText: TextStyle = {
  marginBottom: spacing.md,
  color: colors.error,
  textAlign: "center",
  fontSize: 18,
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
