import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, View, ViewStyle } from "react-native"
import { DrawerScreenProps } from "@react-navigation/drawer"

import { ArticleMedium } from "../components/ArticleMedium"
import { Header } from "../components/Header"
import { Screen } from "../components/Screen"
import { Separator } from "../components/Separator"
import { getPostsByCategory, Post } from "../services/api/wordpress"
import { colors, spacing } from "../theme"

interface SectionScreenProps extends DrawerScreenProps<any, any> {}

export const SectionScreen = ({ navigation, route }: SectionScreenProps) => {
  const { categoryIds, title } = route.params as { categoryIds: number[]; title: string }
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    // Reset state when category changes
    setPosts([])
    setPage(1)
    setHasMore(true)
    fetchPosts(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryIds])

  const fetchPosts = async (pageNum: number, reset = false) => {
    if (loading && !reset) return
    if (!reset && !hasMore) return

    setLoading(true)
    try {
      // If categoryIds is empty or null, getPostsByCategory handles "All Posts" logic internally
      const newPosts = await getPostsByCategory(categoryIds, pageNum)

      if (newPosts.length === 0) {
        setHasMore(false)
      } else {
        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]))
        // Assuming perPage is 10 (default in api service)
        if (newPosts.length < 10) {
          setHasMore(false)
        }
        if (!reset) {
          setPage(pageNum + 1)
        } else {
          setPage(2)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page)
    }
  }

  const renderItem = ({ item }: { item: Post }) => (
    <View>
      <ArticleMedium
        post={item}
        onPress={() => navigation.navigate("ArticleDetail", { postId: item.id, postData: item })}
      />
      <Separator />
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <Header
        title={title}
        leftIcon="menu"
        onLeftPress={() => navigation.toggleDrawer()}
        safeAreaEdges={[]}
      />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={$listContentContainer}
        onEndReached={loadMore}
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

const $listContentContainer: ViewStyle = {
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xl,
}

const $loader: ViewStyle = {
  paddingVertical: 20,
}
