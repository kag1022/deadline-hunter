import AsyncStorage from "@react-native-async-storage/async-storage";

// ストレージキー定数
const SUBJECT_ALIASES_KEY = "subject_aliases";

/**
 * 科目エイリアス（別名）のマップ型
 * { "科目コード": "ユーザーが設定した科目名" }
 */
export type SubjectAliasMap = Record<string, string>;

/**
 * 科目エイリアスマップを取得
 *
 * @returns 科目エイリアスマップ
 */
export async function getSubjectAliases(): Promise<SubjectAliasMap> {
  try {
    const data = await AsyncStorage.getItem(SUBJECT_ALIASES_KEY);
    if (!data) return {};
    return JSON.parse(data) as SubjectAliasMap;
  } catch (error) {
    if (__DEV__) console.error("科目エイリアス取得エラー:", error);
    return {};
  }
}

/**
 * 科目エイリアスマップを保存
 *
 * @param aliases - 科目エイリアスマップ
 */
export async function saveSubjectAliases(
  aliases: SubjectAliasMap,
): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBJECT_ALIASES_KEY, JSON.stringify(aliases));
  } catch (error) {
    if (__DEV__) console.error("科目エイリアス保存エラー:", error);
    throw new Error("科目エイリアスの保存に失敗しました");
  }
}

/**
 * 単一の科目エイリアスを保存
 *
 * @param code - 科目コード
 * @param name - ユーザーが設定した科目名
 */
export async function saveSubjectAlias(
  code: string,
  name: string,
): Promise<void> {
  try {
    const aliases = await getSubjectAliases();
    aliases[code] = name;
    await saveSubjectAliases(aliases);
  } catch (error) {
    if (__DEV__) console.error("科目エイリアス保存エラー:", error);
    throw new Error("科目エイリアスの保存に失敗しました");
  }
}

/**
 * 科目エイリアスを削除
 *
 * @param code - 科目コード
 */
export async function deleteSubjectAlias(code: string): Promise<void> {
  try {
    const aliases = await getSubjectAliases();
    delete aliases[code];
    await saveSubjectAliases(aliases);
  } catch (error) {
    if (__DEV__) console.error("科目エイリアス削除エラー:", error);
    throw new Error("科目エイリアスの削除に失敗しました");
  }
}

/**
 * 科目コードから表示名を取得
 * エイリアスが設定されていればそれを返し、なければ科目コードをそのまま返す
 *
 * @param categoryCode - 科目コード
 * @param aliases - 科目エイリアスマップ
 * @returns 表示する科目名
 */
export function getSubjectDisplayName(
  categoryCode: string,
  aliases: SubjectAliasMap,
): string {
  if (!categoryCode) return "";
  return aliases[categoryCode] || categoryCode;
}
