import React, { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, ImageStyle, View, ViewStyle } from "react-native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { AutoImage } from "../components/AutoImage"
import { getPosts, Post } from "../services/api/wordpress"
import { colors } from "../theme"
import { AppStackParamList } from "../navigators/navigationTypes"
import { format } from "date-fns"
import { decodeHtmlEntities } from "../utils/decodeHtml"

export const ArticleListScreen = ({
  navigation,
}: NativeStackScreenProps<AppStackParamList, "ArticleList">) => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    if (loading || (!hasMore && page > 1)) return
    setLoading(true)
    try {
      const newPosts = await getPosts(page)
      if (newPosts.length === 0) {
        setHasMore(false)
      } else {
        setPosts((prev) => [...prev, ...newPosts])
        setPage((prev) => prev + 1)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: { item: Post }) => {
    // Determine the featured media URL
    const featuredMedia =
      item._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.thumbnail?.source_url ||
      item._embedded?.["wp:featuredmedia"]?.[0]?.source_url

    const authorName = item._embedded?.author?.[0]?.name

    // Decode HTML entities in title and excerpt
    const heading = decodeHtmlEntities(item.title.rendered)
    const content = decodeHtmlEntities(item.excerpt.rendered).trim().slice(0, 100) + "..."

    return (
      <Card
        style={$card}
        heading={heading}
        content={content}
        footer={`${authorName ? authorName + " • " : ""}${format(new Date(item.date), "MMM dd, yyyy")}`}
        onPress={() => navigation.navigate("ArticleDetail", { postId: item.id, postData: item })}
        LeftComponent={
          featuredMedia ? (
            <AutoImage source={{ uri: featuredMedia }} style={$thumbnail} />
          ) : undefined
        }
      />
    )
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
    >
      <View style={$headerContainer}>
        <Text preset="heading" text="The Retrograde" style={$headerText} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={$listContentContainer}
        onEndReached={fetchPosts}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <View style={$loader}>
              <ActivityIndicator color={colors.palette.primary500} />
            </View>
          ) : null
        }
      />
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
}

const $headerContainer: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral300,
  alignItems: "center",
  backgroundColor: colors.background,
}

const $headerText: ViewStyle = {
  // fontFamily is handled by the Text component's preset/weight
}

const $listContentContainer: ViewStyle = {
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 24,
}

const $card: ViewStyle = {
  marginBottom: 16,
  minHeight: 120,
}

const $thumbnail: ImageStyle = {
  width: 80,
  height: 80,
  borderRadius: 8,
  marginRight: 12,
  backgroundColor: colors.palette.neutral300, // placeholder color
}

const $loader: ViewStyle = {
  paddingVertical: 20,
}
