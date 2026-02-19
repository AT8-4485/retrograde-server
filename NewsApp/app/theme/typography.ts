// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import { Platform } from "react-native"
import {
  CormorantGaramond_300Light as cormorantGaramondLight,
  CormorantGaramond_400Regular as cormorantGaramondRegular,
  CormorantGaramond_500Medium as cormorantGaramondMedium,
  CormorantGaramond_600SemiBold as cormorantGaramondSemiBold,
  CormorantGaramond_700Bold as cormorantGaramondBold,
} from "@expo-google-fonts/cormorant-garamond"
import {
  SpaceGrotesk_300Light as spaceGroteskLight,
  SpaceGrotesk_400Regular as spaceGroteskRegular,
  SpaceGrotesk_500Medium as spaceGroteskMedium,
  SpaceGrotesk_600SemiBold as spaceGroteskSemiBold,
  SpaceGrotesk_700Bold as spaceGroteskBold,
} from "@expo-google-fonts/space-grotesk"

export const customFontsToLoad = {
  spaceGroteskLight,
  spaceGroteskRegular,
  spaceGroteskMedium,
  spaceGroteskSemiBold,
  spaceGroteskBold,
  cormorantGaramondLight,
  cormorantGaramondRegular,
  cormorantGaramondMedium,
  cormorantGaramondSemiBold,
  cormorantGaramondBold,
}

const fonts = {
  spaceGrotesk: {
    // Cross-platform Google font.
    light: "spaceGroteskLight",
    normal: "spaceGroteskRegular",
    medium: "spaceGroteskMedium",
    semiBold: "spaceGroteskSemiBold",
    bold: "spaceGroteskBold",
  },
  cormorantGaramond: {
    // Cross-platform Google font.
    light: "cormorantGaramondLight",
    normal: "cormorantGaramondRegular",
    medium: "cormorantGaramondMedium",
    semiBold: "cormorantGaramondSemiBold",
    bold: "cormorantGaramondBold",
  },
  helveticaNeue: {
    // iOS only font.
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
    bold: "HelveticaNeue-Bold",
  },
  system: {
    // System font
    light: "System",
    normal: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
    semiBold: "sans-serif-medium",
    bold: "sans-serif-medium", // Android bold is often handled by fontWeight
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places (Content).
   */
  primary: fonts.cormorantGaramond,
  /**
   * An alternate font used for UI elements (Headers, Buttons, etc).
   */
  secondary: Platform.select({ ios: fonts.system, android: fonts.sansSerif }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: Platform.select({ ios: fonts.courier, android: fonts.monospace }),
}
