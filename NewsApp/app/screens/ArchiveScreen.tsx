import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  ImageStyle,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import { DrawerScreenProps } from "@react-navigation/drawer"
import { CompositeScreenProps } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { format } from "date-fns"

import { AutoImage } from "../components/AutoImage"
import { Icon } from "../components/Icon"
import { Screen } from "../components/Screen"
import { Separator } from "../components/Separator"
import { Text } from "../components/Text"
import { AppStackParamList, DrawerParamList } from "../navigators/navigationTypes"
import { getIssues, Post } from "../services/api/wordpress"
import { colors, spacing, typography } from "../theme"
import { decodeHtmlEntities } from "../utils/decodeHtml"

type ArchiveScreenProps = CompositeScreenProps<
  DrawerScreenProps<DrawerParamList, "Archive">,
  NativeStackScreenProps<AppStackParamList>
>

export const ArchiveScreen = ({ navigation }: ArchiveScreenProps) => {
  const [issues, setIssues] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchIssues()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchIssues = async () => {
    if (loading || (!hasMore && page > 1)) return
    setLoading(true)
    try {
      const result = await getIssues(page)
      if (result.kind === "ok") {
        const newIssues = result.posts
        if (newIssues.length === 0) {
          setHasMore(false)
        } else {
          setIssues((prev) => [...prev, ...newIssues])
          setPage((prev) => prev + 1)
        }
      } else {
        console.error("Error fetching issues:", result.kind)
        // If it's a server error, maybe stop trying?
        // If it's 400 (bad request -> invalid page), stop.
        if (result.kind === "bad-data" || result.kind === "rejected") {
            setHasMore(false)
        }
      }
    } catch (error: any) {
        console.error("Unexpected error:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: { item: Post }) => {
    const featuredMedia =
      item._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.thumbnail?.source_url ||
      item._embedded?.["wp:featuredmedia"]?.[0]?.source_url

    const title = decodeHtmlEntities(item.title.rendered)
    const date = format(new Date(item.date), "MMMM d, yyyy")

    return (
      <View>
        <TouchableOpacity
          style={$itemContainer}
          onPress={() => navigation.navigate("ArticleList", { issueDate: item.date })}
        >
          {featuredMedia && <AutoImage source={{ uri: featuredMedia }} style={$thumbnail} />}
          <View style={$textContainer}>
            <Text style={$title} text={title} />
            <Text style={$date} text={date} />
          </View>
        </TouchableOpacity>
        <Separator />
      </View>
    )
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top", "bottom"]}
      contentContainerStyle={$screenContentContainer}
    >
      <View style={$headerContainer}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={$menuButton}>
          <Icon icon="menu" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text preset="heading" text="Past Issues" style={$headerText} />
      </View>

      <FlatList
        data={issues}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={$listContentContainer}
        onEndReached={fetchIssues}
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
  flexDirection: "row",
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
  alignItems: "center",
  backgroundColor: colors.background,
}

const $menuButton: ViewStyle = {
  paddingRight: spacing.md,
}

const $headerText: TextStyle = {
  flex: 1,
  textAlign: "center",
  marginRight: 24, // balance back button
}

const $listContentContainer: ViewStyle = {
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
  paddingBottom: spacing.xl,
}

const $itemContainer: ViewStyle = {
  flexDirection: "row",
  paddingVertical: spacing.md,
  alignItems: "center",
}

const $thumbnail: ImageStyle = {
  width: 60,
  height: 60,
  borderRadius: 4,
  marginRight: spacing.md,
  backgroundColor: colors.palette.neutral300,
}

const $textContainer: ViewStyle = {
  flex: 1,
}

const $title: TextStyle = {
  fontFamily: typography.primary.semiBold,
  fontSize: 16,
  marginBottom: spacing.xs,
  color: colors.text,
}

const $date: TextStyle = {
  fontFamily: typography.fonts.spaceGrotesk.normal,
  fontSize: 12,
  color: colors.textDim,
}

const $loader: ViewStyle = {
  paddingVertical: 20,
}
