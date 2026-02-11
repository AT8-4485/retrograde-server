import { createDrawerNavigator } from "@react-navigation/drawer"

import { DrawerParamList } from "./navigationTypes"
import { AboutScreen } from "../screens/AboutScreen"
import { ArchiveScreen } from "../screens/ArchiveScreen"
import { ArticleListScreen } from "../screens/ArticleListScreen"
import { SectionScreen } from "../screens/SectionScreen"
import { typography } from "../theme"
import { useAppTheme } from "../theme/context"

const Drawer = createDrawerNavigator<DrawerParamList>()

export const DrawerNavigator = () => {
  const { theme } = useAppTheme()
  const { colors } = theme

  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.palette.primary500,
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: {
          fontFamily: typography.primary.medium,
          fontSize: 18,
        },
        drawerStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Drawer.Screen name="ArticleList" component={ArticleListScreen} options={{ title: "Home" }} />
      <Drawer.Screen
        name="News"
        component={SectionScreen}
        initialParams={{ categoryIds: [1363], title: "News" }}
      />
      <Drawer.Screen
        name="Opinion"
        component={SectionScreen}
        initialParams={{ categoryIds: [1364, 1454], title: "Opinion" }}
      />
      <Drawer.Screen
        name="LifeArts"
        component={SectionScreen}
        options={{ title: "Life & Arts" }}
        initialParams={{ categoryIds: [1365], title: "Life & Arts" }}
      />
      <Drawer.Screen
        name="Comics"
        component={SectionScreen}
        options={{ title: "Comics & Activities" }}
        initialParams={{ categoryIds: [1366], title: "Comics & Activities" }}
      />
      <Drawer.Screen
        name="AllPosts"
        component={SectionScreen}
        options={{ title: "All Posts" }}
        initialParams={{ categoryIds: [], title: "All Posts" }}
      />
      <Drawer.Screen name="Archive" component={ArchiveScreen} options={{ title: "Past Issues" }} />
      <Drawer.Screen name="About" component={AboutScreen} />
    </Drawer.Navigator>
  )
}
