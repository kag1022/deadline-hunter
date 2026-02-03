import { differenceInSeconds, formatDistance } from "date-fns";
import { ja } from "date-fns/locale";
import { useCallback, useEffect, useRef, useState } from "react";

interface CountdownResult {
  /** 残り時間の表示文字列（例: "あと1日2時間30分"） */
  displayText: string;
  /** 残り秒数 */
  totalSeconds: number;
  /** 期限切れかどうか */
  isExpired: boolean;
  /** 24時間以内かどうか（警告表示用） */
  isUrgent: boolean;
  /** 3日以内かどうか（注意表示用） */
  isWarning: boolean;
}

/**
 * リアルタイムカウントダウン表示用フック
 * 1秒ごとに残り時間を更新する
 *
 * @param deadline - 期限のDate
 * @returns カウントダウン情報
 */
export function useCountdown(deadline: Date): CountdownResult {
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 1秒ごとに現在時刻を更新
    intervalRef.current = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const calculate = useCallback((): CountdownResult => {
    const deadlineDate = new Date(deadline);
    const totalSeconds = differenceInSeconds(deadlineDate, now);
    const isExpired = totalSeconds <= 0;
    const isUrgent = totalSeconds <= 24 * 60 * 60; // 24時間以内
    const isWarning = totalSeconds <= 3 * 24 * 60 * 60; // 3日以内

    if (isExpired) {
      return {
        displayText: "期限切れ",
        totalSeconds: 0,
        isExpired: true,
        isUrgent: true,
        isWarning: true,
      };
    }

    // 残り時間を計算
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    // 表示テキストを生成
    let displayText = "あと";
    if (days > 0) {
      displayText += `${days}日`;
    }
    if (hours > 0 || days > 0) {
      displayText += `${hours}時間`;
    }
    if (minutes > 0 || hours > 0 || days > 0) {
      displayText += `${minutes}分`;
    }
    displayText += `${seconds}秒`;

    return {
      displayText,
      totalSeconds,
      isExpired,
      isUrgent,
      isWarning,
    };
  }, [deadline, now]);

  return calculate();
}

/**
 * 相対的な時間表示（例: "3日後"）を取得
 * date-fnsのformatDistanceを使用
 */
export function formatDeadline(deadline: Date): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);

  if (deadlineDate < now) {
    return "期限切れ";
  }

  return formatDistance(deadlineDate, now, {
    addSuffix: true,
    locale: ja,
  });
}
