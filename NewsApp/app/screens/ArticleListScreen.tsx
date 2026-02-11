import React, { useEffect, useState } from "react"
import { ActivityIndicator, TouchableOpacity, View, ViewStyle, TextStyle } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { HeroArticle } from "../components/HeroArticle"
import { ArticleMedium } from "../components/ArticleMedium"
import { ArticleRow } from "../components/ArticleRow"
import { SectionHeader } from "../components/SectionHeader"
import { Separator } from "../components/Separator"
import { getLatestIssue, getPostsByDate, Post } from "../services/api/wordpress"
import { colors, spacing, typography } from "../theme"
import { AppStackParamList } from "../navigators/navigationTypes"
import { format } from "date-fns"

export const ArticleListScreen = ({
  navigation,
  route,
}: NativeStackScreenProps<AppStackParamList, "ArticleList">) => {
  const [loading, setLoading] = useState(false)
  const [issue, setIssue] = useState<Post | null>(null)

  // Sections
  const [heroPost, setHeroPost] = useState<Post | null>(null)
  const [opinionPosts, setOpinionPosts] = useState<Post[]>([])
  const [lifeArtsPosts, setLifeArtsPosts] = useState<Post[]>([])
  const [comicsPosts, setComicsPosts] = useState<Post[]>([])
  const [mainTopPosts, setMainTopPosts] = useState<Post[]>([])
  const [mainBottomPosts, setMainBottomPosts] = useState<Post[]>([])

  useEffect(() => {
    fetchData()
  }, [route.params])

  const fetchData = async () => {
    setLoading(true)
    try {
      let targetDate = route.params?.issueDate
      let issuePost: Post | null = null

      if (targetDate) {
        // We have a target date, so we can use it.
        // We simulate an issue post with just the date for now.
        issuePost = { date: targetDate } as Post
      } else {
        // No date provided, fetch the latest issue post
        issuePost = await getLatestIssue()
        if (issuePost) {
          targetDate = issuePost.date
        }
      }

      if (issuePost && targetDate) {
        setIssue(issuePost)
        const allPosts = await getPostsByDate(targetDate)

        // Filter and distribute posts
        const posts = distributePosts(allPosts)
        setHeroPost(posts.heroPost)
        setOpinionPosts(posts.opinionPosts)
        setLifeArtsPosts(posts.lifeArtsPosts)
        setComicsPosts(posts.comicsPosts)
        setMainTopPosts(posts.mainPosts.slice(0, 3))
        setMainBottomPosts(posts.mainPosts.slice(3))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const distributePosts = (allPosts: Post[]) => {
    // Clone array to modify
    const remaining = [...allPosts]
    let heroPost: Post | null = null

    // 1. Find Hero (Tag 1464 "Featured" or first post)
    const featuredIndex = remaining.findIndex((p) => p.tags.includes(1464))
    if (featuredIndex !== -1) {
      heroPost = remaining[featuredIndex]
      remaining.splice(featuredIndex, 1)
    } else if (remaining.length > 0) {
      heroPost = remaining[0]
      remaining.shift()
    }

    // Helper to extract by category
    const extractByCategory = (catId: number) => {
      const posts = remaining.filter((p) => p.categories.includes(catId))
      return posts
    }

    const opinionPosts = extractByCategory(1364)
    // Remove opinion posts from remaining
    const opinionIds = new Set(opinionPosts.map((p) => p.id))
    let nextRemaining = remaining.filter((p) => !opinionIds.has(p.id))

    const lifeArtsPosts = nextRemaining.filter((p) => p.categories.includes(1365))
    const lifeArtsIds = new Set(lifeArtsPosts.map((p) => p.id))
    nextRemaining = nextRemaining.filter((p) => !lifeArtsIds.has(p.id))

    const comicsPosts = nextRemaining.filter((p) => p.categories.includes(1366))
    const comicsIds = new Set(comicsPosts.map((p) => p.id))
    nextRemaining = nextRemaining.filter((p) => !comicsIds.has(p.id))

    // Main posts are whatever is left (News 1363, etc)
    const mainPosts = nextRemaining

    return { heroPost, opinionPosts, lifeArtsPosts, comicsPosts, mainPosts }
  }

  const navigateToArticle = (post: Post) => {
    navigation.navigate("ArticleDetail", { postId: post.id, postData: post })
  }

  if (loading && !issue) {
    return (
      <View style={$loader}>
        <ActivityIndicator color={colors.palette.primary500} />
      </View>
    )
  }

  return (
    <Screen
      preset="scroll"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
    >
      {/* Header */}
      <View style={$headerContainer}>
        <Text preset="heading" text="The Retrograde" style={$masthead} />
        {issue && (
          <>
            <View style={$subtitleSeparator} />
            <Text style={$issueDate}>
              {`Issue ${format(new Date(issue.date), "MM/dd/yyyy")}`}
            </Text>
          </>
        )}
      </View>
      <Separator />

      {/* Hero */}
      {heroPost && <HeroArticle post={heroPost} onPress={navigateToArticle} />}

      {/* Main / In This Issue */}
      {(mainTopPosts.length > 0 || mainBottomPosts.length > 0) && (
        <View>
          <SectionHeader title="In This Issue" />
          {mainTopPosts.map((post) => (
            <View key={post.id}>
              <ArticleMedium post={post} onPress={navigateToArticle} />
              <Separator />
            </View>
          ))}
          {mainBottomPosts.map((post) => (
            <View key={post.id}>
              <ArticleRow post={post} onPress={navigateToArticle} />
              <Separator />
            </View>
          ))}
          {/* See All link logic could go here if we had more pagination, but currently we fetch all for the issue */}
        </View>
      )}

      {/* Opinion */}
      {opinionPosts.length > 0 && (
        <View>
          <SectionHeader title="Opinion" />
          {opinionPosts.map((post) => (
            <View key={post.id}>
              <ArticleRow post={post} onPress={navigateToArticle} />
              <Separator />
            </View>
          ))}
        </View>
      )}

      {/* Life & Arts */}
      {lifeArtsPosts.length > 0 && (
        <View>
          <SectionHeader title="Life & Arts" />
          {lifeArtsPosts.map((post) => (
            <View key={post.id}>
              <ArticleRow post={post} onPress={navigateToArticle} />
              <Separator />
            </View>
          ))}
        </View>
      )}

      {/* Comics */}
      {comicsPosts.length > 0 && (
        <View>
          <SectionHeader title="Comics & Activities" />
          {comicsPosts.map((post) => (
            <View key={post.id}>
              <ArticleMedium
                post={post}
                onPress={navigateToArticle}
                imageStyle={{ width: 120, height: 120 }}
              />
              <Separator />
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={$footer}>
        <TouchableOpacity onPress={() => navigation.navigate("Archive")}>
          <Text text="Past Issues →" style={$footerLink} />
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  backgroundColor: colors.background,
  paddingBottom: spacing.xl,
}

const $headerContainer: ViewStyle = {
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  alignItems: "center",
  backgroundColor: colors.background,
}

const $masthead: TextStyle = {
  fontFamily: typography.primary.bold,
  fontSize: 32,
  marginBottom: spacing.xxs,
  color: colors.text,
}

const $subtitleSeparator: ViewStyle = {
  height: 1,
  width: 40,
  backgroundColor: colors.palette.neutral300,
  marginVertical: spacing.xs,
}

const $issueDate: TextStyle = {
  fontFamily: typography.fonts.spaceGrotesk.medium,
  fontSize: 12,
  color: colors.textDim,
  letterSpacing: 1,
  textTransform: "uppercase",
}

const $loader: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  paddingVertical: 20,
}

const $footer: ViewStyle = {
  paddingVertical: spacing.xl,
  alignItems: "center",
}

const $footerLink: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 18,
  color: colors.palette.primary500,
}
