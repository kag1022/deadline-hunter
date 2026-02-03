import { Assignment, RawICSEvent } from "@/types/assignment";

/**
 * ICSデータを解析してAssignment配列を返す
 * node-icalはReact Nativeで動作しないため、独自パーサーを実装
 *
 * @param icsData - ICS形式の文字列データ
 * @returns 課題の配列（期限順にソート済み）
 */
export function parseICS(icsData: string): Assignment[] {
  try {
    const events = extractEvents(icsData);
    const assignments = events
      .map(eventToAssignment)
      .filter((a): a is Assignment => a !== null);

    // 期限が近い順にソート
    return assignments.sort(
      (a, b) => a.deadline.getTime() - b.deadline.getTime(),
    );
  } catch (error) {
    if (__DEV__) console.error("ICS解析エラー:", error);
    return [];
  }
}

/**
 * ICS文字列からVEVENTブロックを抽出
 * 正規表現でBEGIN:VEVENTとEND:VEVENTの間を取得
 */
function extractEvents(icsData: string): RawICSEvent[] {
  const events: RawICSEvent[] = [];

  // VEVENTブロックを正規表現で抽出（DOTALLモードが使えないため[\s\S]を使用）
  const eventRegex = /BEGIN:VEVENT[\s\S]*?END:VEVENT/g;
  const eventBlocks = icsData.match(eventRegex) || [];

  for (const block of eventBlocks) {
    const uid = extractProperty(block, "UID");
    const summary = extractProperty(block, "SUMMARY");
    const dtend =
      extractProperty(block, "DTEND") || extractProperty(block, "DTSTART");
    const categories = extractProperty(block, "CATEGORIES");

    // 必須フィールドが揃っている場合のみ追加
    if (uid && summary && dtend) {
      events.push({ uid, summary, dtend, categories: categories || undefined });
    }
  }

  return events;
}

/**
 * ICSブロックから特定プロパティの値を抽出
 * 複数行にまたがる値（折り返し）にも対応
 *
 * @param block - VEVENTブロックの文字列
 * @param propertyName - 抽出するプロパティ名（例: 'SUMMARY'）
 */
function extractProperty(block: string, propertyName: string): string | null {
  // プロパティはコロンで区切られ、パラメータがセミコロンで付く場合がある
  // 例: DTEND;VALUE=DATE:20240315 または DTEND:20240315T235959Z
  const regex = new RegExp(`^${propertyName}[;:](.*)$`, "im");
  const match = block.match(regex);

  if (!match) return null;

  let value = match[1];

  // パラメータ部分を除去（コロン以降が実際の値）
  if (value.includes(":")) {
    value = value.split(":").slice(1).join(":");
  }

  // エスケープされた文字を復元
  value = value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();

  return value;
}

/**
 * RawICSEventをAssignmentに変換
 * 日付のパースに失敗した場合はnullを返す
 */
function eventToAssignment(event: RawICSEvent): Assignment | null {
  const deadline = parseICSDate(event.dtend);

  if (!deadline) {
    if (__DEV__) console.warn(`日付パース失敗: ${event.dtend}`);
    return null;
  }

  return {
    uid: event.uid,
    summary: event.summary,
    categoryCode: event.categories || "",
    deadline,
    isCompleted: false,
  };
}

/**
 * ICS形式の日付文字列をDateオブジェクトに変換
 * 対応形式:
 * - 20240315T235959Z (UTC)
 * - 20240315T235959 (ローカル)
 * - 20240315 (日付のみ)
 */
function parseICSDate(dateStr: string): Date | null {
  try {
    // タイムゾーン情報を除去（TZID=...などを削除）
    const cleanStr = dateStr.replace(/^[^:]*:/, "").trim();

    // 基本形式: YYYYMMDDTHHMMSS または YYYYMMDD
    const basicMatch = cleanStr.match(
      /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?Z?$/,
    );

    if (basicMatch) {
      const [, year, month, day, hour = "23", minute = "59", second = "59"] =
        basicMatch;
      const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

      // Zで終わる場合はUTC、そうでなければローカルタイム
      if (cleanStr.endsWith("Z")) {
        return new Date(dateString + "Z");
      }
      return new Date(dateString);
    }

    // ISO形式の場合はそのままパース
    const date = new Date(cleanStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    return null;
  } catch {
    return null;
  }
}
