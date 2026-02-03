/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const palette = {
  primary: "#FFFFFF",
  secondary: "#A0A0A0",
  background: "#0F0C29",
  card: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.2)",
  urgent: "#FF4B4B",
  warning: "#FFD700",
  safe: "#00E676",
  gradient: ["#0F0C29", "#302B63", "#24243E"],
};

export const Colors = {
  light: {
    text: palette.primary,
    textSecondary: palette.secondary,
    background: palette.background,
    tint: palette.primary,
    icon: palette.secondary,
    tabIconDefault: palette.secondary,
    tabIconSelected: palette.primary,
    card: palette.card,
    border: palette.border,
    status: {
      urgent: palette.urgent,
      warning: palette.warning,
      safe: palette.safe,
    },
    gradient: palette.gradient,
  },
  dark: {
    text: palette.primary,
    textSecondary: palette.secondary,
    background: palette.background,
    tint: palette.primary,
    icon: palette.secondary,
    tabIconDefault: palette.secondary,
    tabIconSelected: palette.primary,
    card: palette.card,
    border: palette.border,
    status: {
      urgent: palette.urgent,
      warning: palette.warning,
      safe: palette.safe,
    },
    gradient: palette.gradient,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
