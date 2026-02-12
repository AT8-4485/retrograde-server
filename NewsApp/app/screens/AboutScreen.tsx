import { ViewStyle, TextStyle } from "react-native"
import { DrawerScreenProps } from "@react-navigation/drawer"

import { Header } from "../components/Header"
import { Screen } from "../components/Screen"
import { Text } from "../components/Text"
import { colors, spacing } from "../theme"

interface AboutScreenProps extends DrawerScreenProps<any, "About"> {}

export const AboutScreen = ({ navigation }: AboutScreenProps) => {
  return (
    <Screen preset="scroll" safeAreaEdges={["top"]} contentContainerStyle={$screenContentContainer}>
      <Header
        title="About"
        leftIcon="menu"
        onLeftPress={() => navigation.toggleDrawer()}
        safeAreaEdges={[]}
      />
      <Text preset="heading" text="About The Retrograde" style={$heading} />
      <Text style={$content}>
        The Retrograde is a student-run newspaper dedicated to providing news and opinion for the
        community. This app brings the latest issues directly to your device.
      </Text>
      <Text style={$content}>Version 1.0.0</Text>
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
  paddingHorizontal: spacing.md,
  paddingBottom: spacing.xl,
}

const $heading: TextStyle = {
  marginBottom: spacing.md,
  marginTop: spacing.md,
}

const $content: TextStyle = {
  marginBottom: spacing.sm,
  fontSize: 16,
  lineHeight: 24,
}
