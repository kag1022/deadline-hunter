import {
    cancelNotificationsForAssignment,
    requestNotificationPermission,
    scheduleNotifications,
} from "@/services/notifications";
import {
    getCompletedUids,
    getMoodleUrl,
    saveCompletedUids,
} from "@/services/storage";
import { Assignment } from "@/types/assignment";
import { parseICS } from "@/utils/ics-parser";
import { useCallback, useEffect, useState } from "react";

interface UseAssignmentsResult {
  /** 課題一覧（期限順、完了済みを除く） */
  assignments: Assignment[];
  /** 読み込み中フラグ */
  loading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** データを再読み込み */
  refresh: () => Promise<void>;
  /** 課題を完了にする */
  toggleComplete: (uid: string) => Promise<void>;
  /** iCal URLが設定されているか */
  hasUrl: boolean;
  /** URLに変更があった場合のみ再読み込み */
  refreshIfUrlChanged: () => Promise<void>;
}

/**
 * 課題データ管理フック
 * iCal URLからのデータ取得、完了状態の管理、通知のスケジュールを担当
 */
export function useAssignments(): UseAssignmentsResult {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [completedUids, setCompletedUids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUrl, setHasUrl] = useState(false);
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  /**
   * iCal URLからデータを取得して課題一覧を更新
   */
  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Moodle URLを取得
      const url = await getMoodleUrl();
      if (!url) {
        setHasUrl(false);
        setAssignments([]);
        setLoading(false);
        setLoadedUrl(null);
        return;
      }
      setHasUrl(true);
      // URLが取得できたらloadedUrlを一時的に更新（成功後に確定するが、ここでは比較用に保持）
      // 成功時のみ更新するのが正しいが、無限ループ防止のためここでも意識

      // 完了済みUID一覧を取得
      const completed = await getCompletedUids();
      setCompletedUids(completed);

      // ICSデータを取得
      const response = await fetch(url, {
        headers: {
          Accept: "text/calendar",
        },
      });

      if (!response.ok) {
        throw new Error(`データ取得に失敗しました (HTTP ${response.status})`);
      }

      const icsData = await response.text();

      // ICSをパースして課題一覧を取得
      const parsedAssignments = parseICS(icsData);

      if (parsedAssignments.length === 0) {
        // データは取得できたが課題がない場合
        setAssignments([]);
        setLoading(false);
        return;
      }

      // 完了状態を反映し、期限切れでない課題のみを取得
      // 完了済みの課題も含める（完了リストとして表示するため）
      const activeAssignments = parsedAssignments.map((a) => ({
        ...a,
        isCompleted: completed.includes(a.uid),
      }));
      // .filter((a) => !a.isCompleted) // 削除: 完了済みも保持する

      setAssignments(activeAssignments);
      setLoadedUrl(url);

      // 通知許可をリクエストして通知をスケジュール
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        for (const assignment of activeAssignments) {
          if (!assignment.isCompleted && assignment.deadline > new Date()) {
            await scheduleNotifications(assignment);
          }
        }
      }
    } catch (err) {
      if (__DEV__) console.error("課題取得エラー:", err);
      setError(
        "課題データの取得に失敗しました。通信環境または設定されたURLを確認してください。",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 課題の完了状態をトグル
   */
  const toggleComplete = useCallback(
    async (uid: string) => {
      try {
        const isPreviouslyCompleted = completedUids.includes(uid);
        const newCompletedUids = isPreviouslyCompleted
          ? completedUids.filter((id) => id !== uid)
          : [...completedUids, uid];

        // 永続化
        await saveCompletedUids(newCompletedUids);
        setCompletedUids(newCompletedUids);

        // UI更新
        // 完了状態を反転させる完のみ（フィルタリングしない）
        const updatedAssignments = assignments.map((a) =>
          a.uid === uid ? { ...a, isCompleted: !a.isCompleted } : a,
        );
        setAssignments(updatedAssignments);

        if (isPreviouslyCompleted) {
          // 完了 -> 未完了 (Undo): 通知を再予約
          const targetAssignment = updatedAssignments.find(
            (a) => a.uid === uid,
          );
          if (targetAssignment && targetAssignment.deadline > new Date()) {
            await scheduleNotifications(targetAssignment);
            if (__DEV__) console.log("通知を再予約しました:", uid);
          }
        } else {
          // 未完了 -> 完了: 通知をキャンセル
          await cancelNotificationsForAssignment(uid);
        }
      } catch (err) {
        if (__DEV__) console.error("完了状態更新エラー:", err);
      }
    },
    [completedUids, assignments],
  );

  // 初回読み込み
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  /**
   * 保存されているURLが、現在ロード済みのURLと異なる場合のみ再読み込み
   */
  const refreshIfUrlChanged = useCallback(async () => {
    if (loading) return;
    const storedUrl = await getMoodleUrl();
    if (storedUrl !== loadedUrl) {
      if (__DEV__)
        console.log("URL Changed (or first load), refreshing...", storedUrl);
      await fetchAssignments();
    }
  }, [loading, loadedUrl, fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    refresh: fetchAssignments,
    toggleComplete,
    hasUrl,
    refreshIfUrlChanged,
  };
}
