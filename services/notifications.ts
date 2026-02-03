import { Assignment } from "@/types/assignment";
import * as Notifications from "expo-notifications";

// 通知の表示設定（フォアグラウンドでも通知を表示）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * 通知の許可をリクエスト
 * iOS/Androidで通知許可ダイアログを表示
 *
 * @returns 許可が得られた場合true
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("通知許可リクエストエラー:", error);
    return false;
  }
}

/**
 * 課題の期限前通知をスケジュール
 * 24時間前と1時間前の2つの通知を予約
 *
 * @param assignment - 通知対象の課題
 */
export async function scheduleNotifications(
  assignment: Assignment,
): Promise<void> {
  const now = new Date();
  const deadline = new Date(assignment.deadline);

  // 24時間前の通知
  const twentyFourHoursBefore = new Date(
    deadline.getTime() - 24 * 60 * 60 * 1000,
  );
  if (twentyFourHoursBefore > now) {
    await scheduleNotification(
      assignment.uid + "_24h",
      `📚 ${assignment.summary}`,
      "期限まであと24時間です",
      twentyFourHoursBefore,
    );
  }

  // 1時間前の通知
  const oneHourBefore = new Date(deadline.getTime() - 60 * 60 * 1000);
  if (oneHourBefore > now) {
    await scheduleNotification(
      assignment.uid + "_1h",
      `⚠️ ${assignment.summary}`,
      "期限まであと1時間です！",
      oneHourBefore,
    );
  }
}

/**
 * 単一の通知をスケジュール
 *
 * @param identifier - 通知の一意識別子（キャンセル時に使用）
 * @param title - 通知タイトル
 * @param body - 通知本文
 * @param triggerDate - 通知を表示する日時
 */
async function scheduleNotification(
  identifier: string,
  title: string,
  body: string,
  triggerDate: Date,
): Promise<void> {
  try {
    // 既存の同じIDの通知をキャンセル（重複防止）
    await Notifications.cancelScheduledNotificationAsync(identifier);

    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`通知予約: ${identifier} at ${triggerDate.toLocaleString()}`);
  } catch (error) {
    console.error("通知スケジュールエラー:", error);
  }
}

/**
 * 特定の課題に関連する全通知をキャンセル
 * 課題を完了にした時に呼び出す
 *
 * @param uid - 課題のUID
 */
export async function cancelNotificationsForAssignment(
  uid: string,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(uid + "_24h");
    await Notifications.cancelScheduledNotificationAsync(uid + "_1h");
    console.log(`通知キャンセル: ${uid}`);
  } catch (error) {
    console.error("通知キャンセルエラー:", error);
  }
}

/**
 * 全てのスケジュール済み通知をキャンセル
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("全通知をキャンセルしました");
  } catch (error) {
    console.error("全通知キャンセルエラー:", error);
  }
}

/**
 * 現在スケジュールされている通知一覧を取得（デバッグ用）
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("スケジュール済み通知取得エラー:", error);
    return [];
  }
}
