import React from "react"
import { View, ViewStyle } from "react-native"
import { colors, spacing } from "../theme"

export const Separator = () => <View style={$separator} />

const $separator: ViewStyle = {
  height: 1,
  backgroundColor: colors.separator,
  marginHorizontal: spacing.md,
  marginVertical: spacing.xs,
}
