import React from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Text } from "./Text"
import { colors, spacing, typography } from "../theme"

interface SectionHeaderProps {
  title: string
  style?: ViewStyle
}

export const SectionHeader = ({ title, style }: SectionHeaderProps) => {
  return (
    <View style={[$container, style]}>
      <Text text={title.toUpperCase()} style={$text} />
    </View>
  )
}

const $container: ViewStyle = {
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral300,
  marginBottom: spacing.sm,
  marginTop: spacing.lg,
}

const $text: TextStyle = {
  fontFamily: typography.fonts.spaceGrotesk.medium,
  fontSize: 11,
  letterSpacing: 1.5,
  color: colors.palette.neutral600,
}
