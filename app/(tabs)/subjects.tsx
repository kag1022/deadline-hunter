import { BackgroundGradient } from "@/components/background-gradient";
import { useAssignments } from "@/hooks/use-assignments";
import {
    deleteSubjectAlias,
    getSubjectAliases,
    saveSubjectAlias,
    SubjectAliasMap,
} from "@/services/subject-aliases";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * 科目設定画面
 * 科目コードに対してユーザー定義の別名を設定
 */
export default function SubjectsScreen() {
  const { assignments, loading } = useAssignments();

  const [aliases, setAliases] = useState<SubjectAliasMap>({});
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [saving, setSaving] = useState(false);

  // 科目エイリアスを読み込み
  useEffect(() => {
    const loadAliases = async () => {
      const loadedAliases = await getSubjectAliases();
      setAliases(loadedAliases);
    };
    loadAliases();
  }, []);

  // ユニークな科目コード一覧を取得
  const uniqueCategoryCodes = Array.from(
    new Set(
      assignments.map((a) => a.categoryCode).filter((code) => code !== ""),
    ),
  ).sort();

  /**
   * エイリアスを保存
   */
  const handleSave = async (code: string, name: string) => {
    if (!name.trim()) {
      Alert.alert("エラー", "科目名を入力してください");
      return;
    }

    setSaving(true);
    try {
      await saveSubjectAlias(code, name.trim());
      setAliases((prev) => ({ ...prev, [code]: name.trim() }));
      setEditingCode(null);
      setEditingValue("");
      Alert.alert("保存完了", "科目名を保存しました");
    } catch (error) {
      Alert.alert("エラー", "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  /**
   * エイリアスを削除
   */
  const handleDelete = async (code: string) => {
    Alert.alert("確認", "科目名を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSubjectAlias(code);
            setAliases((prev) => {
              const newAliases = { ...prev };
              delete newAliases[code];
              return newAliases;
            });
            Alert.alert("削除完了", "科目名を削除しました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
          }
        },
      },
    ]);
  };

  /**
   * 編集を開始
   */
  const startEditing = (code: string) => {
    setEditingCode(code);
    setEditingValue(aliases[code] || "");
  };

  /**
   * 編集をキャンセル
   */
  const cancelEditing = () => {
    setEditingCode(null);
    setEditingValue("");
  };

  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  if (uniqueCategoryCodes.length === 0) {
    return (
      <BackgroundGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={80} color="#6B7280" />
          <Text style={styles.emptyTitle}>科目がありません</Text>
          <Text style={styles.emptyText}>
            課題に科目コードが含まれていません
          </Text>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons
            name="school-outline"
            size={28}
            color="#FFFFFF"
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>科目設定</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {uniqueCategoryCodes.length}件の科目
        </Text>
      </View>

      {/* 科目リスト */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {uniqueCategoryCodes.map((code) => {
          const isEditing = editingCode === code;
          const displayName = aliases[code] || code;

          return (
            <BlurView
              key={code}
              intensity={40}
              tint="dark"
              style={styles.subjectCard}
            >
              {/* 科目コード */}
              <View style={styles.codeContainer}>
                <Ionicons
                  name="pricetag-outline"
                  size={16}
                  color="#A0A0A0"
                  style={styles.codeIcon}
                />
                <Text style={styles.codeText}>{code}</Text>
              </View>

              {isEditing ? (
                // 編集モード
                <>
                  <TextInput
                    style={styles.input}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    placeholder="科目名を入力"
                    placeholderTextColor="#999"
                    autoFocus
                  />
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={cancelEditing}
                    >
                      <Text style={styles.cancelButtonText}>キャンセル</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.saveButton]}
                      onPress={() => handleSave(code, editingValue)}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={styles.saveButtonText}>保存</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // 表示モード
                <>
                  <View style={styles.displayRow}>
                    <Text style={styles.displayName}>{displayName}</Text>
                    {aliases[code] && (
                      <View style={styles.aliasChip}>
                        <Text style={styles.aliasChipText}>カスタム</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => startEditing(code)}
                    >
                      <Ionicons
                        name="create-outline"
                        size={20}
                        color="#60A5FA" // Light Blue
                      />
                    </TouchableOpacity>
                    {aliases[code] && (
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDelete(code)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </BlurView>
          );
        })}
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 36,
    color: "#A0A0A0",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    color: "#D1D5DB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#FFFFFF",
  },
  subjectCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)", // Subtle border
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Glass background
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  codeIcon: {
    marginRight: 4,
  },
  codeText: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#A0A0A0",
  },
  displayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  displayName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  aliasChip: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aliasChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFFFFF",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#2563EB",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
});
