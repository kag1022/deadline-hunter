import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ストレージキー定数
const MOODLE_URL_KEY = "moodle_ical_url";
const COMPLETED_UIDS_KEY = "completed_assignment_uids";

/**
 * Web環境かどうかを判定
 */
const isWeb = Platform.OS === "web";

/**
 * Moodle URLを安全に保存
 * - Native: SecureStore (暗号化)
 * - Web: AsyncStorage (非暗号化・フォールバック)
 *
 * @param url - 保存するiCal URL
 */
export async function saveMoodleUrl(url: string): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(MOODLE_URL_KEY, url);
    } else {
      await SecureStore.setItemAsync(MOODLE_URL_KEY, url);
    }
  } catch (error) {
    if (__DEV__) console.error("URL保存エラー:", error);
    throw new Error("URLの保存に失敗しました");
  }
}

/**
 * Moodle URLを取得
 *
 * @returns 保存されているURL、または未設定の場合はnull
 */
export async function getMoodleUrl(): Promise<string | null> {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(MOODLE_URL_KEY);
    } else {
      // 1. SecureStoreから取得
      const secureUrl = await SecureStore.getItemAsync(MOODLE_URL_KEY);
      if (secureUrl) return secureUrl;

      // 2. マイグレーション: 旧AsyncStorage (Native環境での旧バージョンデータ)
      // Native移行直後のユーザーのため
      const legacyUrl = await AsyncStorage.getItem(MOODLE_URL_KEY);
      if (legacyUrl) {
        if (__DEV__) console.log("Migrating legacy URL to SecureStore...");
        await SecureStore.setItemAsync(MOODLE_URL_KEY, legacyUrl);
        await AsyncStorage.removeItem(MOODLE_URL_KEY);
        return legacyUrl;
      }
      return null;
    }
  } catch (error) {
    if (__DEV__) console.error("URL取得エラー:", error);
    return null;
  }
}

/**
 * Moodle URLを削除
 */
export async function removeMoodleUrl(): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.removeItem(MOODLE_URL_KEY);
    } else {
      await SecureStore.deleteItemAsync(MOODLE_URL_KEY);
      // 万が一の残存ゴミも削除
      await AsyncStorage.removeItem(MOODLE_URL_KEY);
    }
  } catch (error) {
    if (__DEV__) console.error("URL削除エラー:", error);
  }
}

/**
 * 完了した課題のUID一覧を保存 (機密性低のためAsyncStorage)
 */
export async function saveCompletedUids(uids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPLETED_UIDS_KEY, JSON.stringify(uids));
  } catch (error) {
    if (__DEV__) console.error("完了UID保存エラー:", error);
  }
}

/**
 * 完了した課題のUID一覧を取得
 */
export async function getCompletedUids(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(COMPLETED_UIDS_KEY);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch (error) {
    if (__DEV__) console.error("完了UID取得エラー:", error);
    return [];
  }
}

/**
 * 完了状態をクリア (デバッグ用)
 */
export async function clearCompletedUids(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COMPLETED_UIDS_KEY);
  } catch (error) {
    if (__DEV__) console.error("完了UIDクリアエラー:", error);
  }
}
