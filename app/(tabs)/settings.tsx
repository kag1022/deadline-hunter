import { BackgroundGradient } from "@/components/background-gradient";
import { deleteICalUrl, getICalUrl, saveICalUrl } from "@/services/storage";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * 設定画面
 * iCal URLの入力・保存・テストを行う
 */
export default function SettingsScreen() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // 保存済みURLを読み込み
  useEffect(() => {
    const loadUrl = async () => {
      const storedUrl = await getICalUrl();
      if (storedUrl) {
        setUrl(storedUrl);
        setSavedUrl(storedUrl);
      }
    };
    loadUrl();
  }, []);

  /**
   * URLの接続テストを実行
   */
  const handleTest = async () => {
    if (!url.trim()) {
      Alert.alert("エラー", "URLを入力してください");
      return;
    }

    // 基本的なURL検証
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      Alert.alert("エラー", "URLはhttp://またはhttps://で始まる必要があります");
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(url, {
        headers: { Accept: "text/calendar" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();

      // ICS形式かどうかを簡易チェック
      if (!text.includes("BEGIN:VCALENDAR")) {
        throw new Error("有効なiCalファイルではありません");
      }

      // VEVENTの数をカウント
      const eventCount = (text.match(/BEGIN:VEVENT/g) || []).length;

      Alert.alert(
        "接続成功",
        `iCalデータを取得できました！\n${eventCount}件のイベントが見つかりました。`,
      );
    } catch (error) {
      Alert.alert(
        "接続失敗",
        "無効なURLまたは通信エラーが発生しました。URLを確認してください。",
      );
    } finally {
      setTesting(false);
    }
  };

  /**
   * URLを保存
   */
  const handleSave = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      Alert.alert("エラー", "URLを入力してください");
      return;
    }

    // セキュリティ: HTTPS必須
    if (!trimmedUrl.startsWith("https://")) {
      Alert.alert(
        "セキュリティエラー",
        "安全のため、HTTPS (https://) で始まるURLのみ登録可能です。",
      );
      return;
    }

    // セキュリティ: エンドポイント検証
    if (
      !trimmedUrl.includes("calendar/export_execute.php") &&
      !trimmedUrl.includes("calendar/export_ical.php")
    ) {
      Alert.alert(
        "形式エラー",
        "iCal URLの形式が正しくありません。\n'calendar/export_execute.php' が含まれていることを確認してください。",
      );
      return;
    }

    setSaving(true);
    try {
      await saveICalUrl(trimmedUrl);
      setSavedUrl(trimmedUrl);

      // セキュリティ: クリップボード履歴消去
      await Clipboard.setStringAsync("");

      Alert.alert(
        "保存完了",
        "iCal URLを安全に保存しました。\nセキュリティのためクリップボードは消去されました。",
      );
    } catch (error) {
      Alert.alert("エラー", "保存処理に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  /**
   * URLを削除
   */
  const handleDelete = async () => {
    Alert.alert("確認", "iCal URLを削除しますか?", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          await deleteICalUrl();
          setUrl("");
          setSavedUrl(null);
          Alert.alert("削除完了", "iCal URLを削除しました");
        },
      },
    ]);
  };

  return (
    <BackgroundGradient>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons
                name="settings-outline"
                size={28}
                color="#FFFFFF"
                style={styles.headerIcon}
              />
              <Text style={styles.headerTitle}>設定</Text>
            </View>
          </View>

          {/* iCal URL設定セクション */}
          <BlurView intensity={40} tint="dark" style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="link-outline"
                size={20}
                color="#FFFFFF"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Moodle iCal URL</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Moodleのカレンダーページから取得できるiCal URLを入力してください
            </Text>

            {/* URL入力フィールド */}
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://moodle.example.com/calendar/export_execute.php?..."
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              multiline
              numberOfLines={3}
            />

            {/* ボタン群 */}
            <View style={styles.buttonContainer}>
              {/* テストボタン */}
              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={handleTest}
                disabled={testing || !url.trim()}
              >
                {testing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="search-outline"
                      size={18}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>接続テスト</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* 保存ボタン */}
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={saving || !url.trim()}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={18}
                      color="#FFFFFF"
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.buttonText}>保存</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* 削除ボタン（保存済みの場合のみ表示） */}
            {savedUrl && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color="#EF4444"
                  style={styles.buttonIcon}
                />
                <Text style={styles.deleteButtonText}>URLを削除</Text>
              </TouchableOpacity>
            )}
          </BlurView>

          {/* ヘルプセクション */}
          <BlurView intensity={40} tint="dark" style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Ionicons
                name="help-circle-outline"
                size={20}
                color="#FFFFFF"
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>iCal URLの取得方法</Text>
            </View>
            <View style={styles.helpList}>
              <Text style={styles.helpItem}>1. Moodleにログイン</Text>
              <Text style={styles.helpItem}>2. カレンダーページを開く</Text>
              <Text style={styles.helpItem}>
                3. 「カレンダーをエクスポート」を選択
              </Text>
              <Text style={styles.helpItem}>
                4. 「iCalendar URLを取得」をクリック
              </Text>
              <Text style={styles.helpItem}>5. 表示されたURLをコピー</Text>
            </View>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)", // Subtle border
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Glass background
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionIcon: {
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    color: "#A0A0A0",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    backgroundColor: "rgba(0, 0, 0, 0.2)", // Dark input background
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: "#FFFFFF",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Glass button
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  saveButton: {
    backgroundColor: "#2563EB", // Strong Blue
    shadowOpacity: 0.3,
  },
  deleteButton: {
    marginTop: 12,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
  },
  helpList: {
    marginTop: 8,
  },
  helpItem: {
    fontSize: 14,
    lineHeight: 24,
    color: "#D1D5DB",
  },
});
