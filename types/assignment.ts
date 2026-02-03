/**
 * 課題データの型定義
 * ICSファイルから抽出したVEVENTデータを表現します
 */
export interface Assignment {
  /** ICS内のUID（一意識別子） */
  uid: string;
  /** 課題名（SUMMARYから抽出） */
  summary: string;
  /** 科目コード（CATEGORIESから抽出、なければ空文字） */
  categoryCode: string;
  /** 期限（DTENDから抽出） */
  deadline: Date;
  /** 完了フラグ（ユーザーがチェックした場合true） */
  isCompleted: boolean;
}

/**
 * ICSイベントの生データ型
 * パース直後の中間データ構造
 */
export interface RawICSEvent {
  uid: string;
  summary: string;
  dtend: string;
  categories?: string;
}
