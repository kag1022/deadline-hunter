import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// ストレージキー定数
const ICAL_URL_KEY = "moodle_ical_url";
const COMPLETED_UIDS_KEY = "completed_assignment_uids";

/**
 * iCal URLをSecureStoreに保存
 * SecureStoreはデバイスのキーチェーン/キーストアを使用するため安全
 *
 * @param url - 保存するiCal URL
 */
export async function saveICalUrl(url: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ICAL_URL_KEY, url);
  } catch (error) {
    console.error("iCal URL保存エラー:", error);
    throw new Error("URLの保存に失敗しました");
  }
}

/**
 * SecureStoreからiCal URLを取得
 *
 * @returns 保存されているURL、または未設定の場合はnull
 */
export async function getICalUrl(): Promise<string | null> {
  try {
    // 1. SecureStoreから取得を試みる
    const secureUrl = await SecureStore.getItemAsync(ICAL_URL_KEY);
    if (secureUrl) return secureUrl;

    // 2. マイグレーション: 旧AsyncStorageから取得を試みる
    const legacyUrl = await AsyncStorage.getItem(ICAL_URL_KEY);
    if (legacyUrl) {
      console.log("Migrating iCal URL to SecureStore...");
      await SecureStore.setItemAsync(ICAL_URL_KEY, legacyUrl);
      await AsyncStorage.removeItem(ICAL_URL_KEY);
      return legacyUrl;
    }

    return null;
  } catch (error) {
    console.error("iCal URL取得エラー:", error);
    // SecureStoreが利用できない場合などのフォールバックはここでは行わずnullを返す
    return null;
  }
}

/**
 * iCal URLを削除
 */
export async function deleteICalUrl(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ICAL_URL_KEY);
  } catch (error) {
    console.error("iCal URL削除エラー:", error);
  }
}

/**
 * 完了した課題のUID一覧をAsyncStorageに保存
 * AsyncStorageは暗号化されないが、完了状態は機密性が低いためこちらを使用
 *
 * @param uids - 完了課題のUID配列
 */
export async function saveCompletedUids(uids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(COMPLETED_UIDS_KEY, JSON.stringify(uids));
  } catch (error) {
    console.error("完了UID保存エラー:", error);
    throw new Error("完了状態の保存に失敗しました");
  }
}

/**
 * 完了した課題のUID一覧を取得
 *
 * @returns 完了課題のUID配列
 */
export async function getCompletedUids(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(COMPLETED_UIDS_KEY);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error("完了UID取得エラー:", error);
    return [];
  }
}

/**
 * 完了状態をクリア（デバッグ用）
 */
export async function clearCompletedUids(): Promise<void> {
  try {
    await AsyncStorage.removeItem(COMPLETED_UIDS_KEY);
  } catch (error) {
    console.error("完了UIDクリアエラー:", error);
  }
}
