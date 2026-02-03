import { ColorSchemeName } from "react-native";

/**
 * ダークモードを強制するためのフック
 * アプリ全体が常にダークテーマで動作するように 'dark' を返します。
 */
export function useColorScheme(): ColorSchemeName {
  return "dark";
}
