import { AssignmentCard } from "@/components/assignment-card";
import { useAssignments } from "@/hooks/use-assignments";
import {
    getSubjectAliases,
    getSubjectDisplayName,
    SubjectAliasMap,
} from "@/services/subject-aliases";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * 課題一覧画面
 * メインタブ - iCalから取得した課題を期限順に表示
 */
import { BackgroundGradient } from "@/components/background-gradient";

export default function AssignmentsScreen() {
  const router = useRouter();
  const {
    assignments,
    loading,
    error,
    refresh,
    toggleComplete,
    hasUrl,
    refreshIfUrlChanged,
  } = useAssignments();
  const [subjectAliases, setSubjectAliases] = useState<SubjectAliasMap>({});
  const [showCompleted, setShowCompleted] = useState(false);

  // 画面が表示されるたびにエイリアスを再読み込み
  // 画面が表示されるたびにエイリアスと課題を再読み込み
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // エイリアス更新
        const aliases = await getSubjectAliases();
        setSubjectAliases(aliases);
        // 課題データ更新 (URL変更の反映など)
        // 課題データ更新 (URL変更があった場合のみ)
        await refreshIfUrlChanged();
      };
      loadData();
    }, [refreshIfUrlChanged]),
  );

  // 未完了と完了済みに分割
  const activeAssignments = assignments.filter((a) => !a.isCompleted);
  const completedAssignments = assignments.filter((a) => a.isCompleted);

  // URL未設定時の表示
  if (!hasUrl && !loading) {
    return (
      <BackgroundGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="reader-outline" size={80} color="#6B7280" />
          <Text style={styles.emptyTitle}>Deadline Hunter</Text>
          <Text style={styles.emptyText}>
            Moodleの課題を追跡するには{"\n"}iCal URLを設定してください
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.setupButtonText}>設定画面へ</Text>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    );
  }

  // エラー時の表示
  if (error) {
    return (
      <BackgroundGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="warning-outline" size={80} color="#EF4444" />
          <Text style={styles.emptyTitle}>エラーが発生しました</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    );
  }

  // 読み込み中の表示
  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>課題を読み込み中...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  // 課題がない場合の表示
  if (assignments.length === 0) {
    return (
      <BackgroundGradient>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={80} color="#10B981" />
          <Text style={styles.emptyTitle}>課題はありません</Text>
          <Text style={styles.emptyText}>
            全ての課題を完了しました！{"\n"}または新しい課題がありません
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Ionicons
              name="refresh-outline"
              size={20}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text style={styles.retryButtonText}>更新</Text>
          </TouchableOpacity>
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
            name="list-outline"
            size={28}
            color="#FFFFFF"
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>課題一覧</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          残り{activeAssignments.length}件の課題
        </Text>
      </View>

      {/* 課題リスト */}
      <FlatList
        data={activeAssignments}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <AssignmentCard
            assignment={item}
            onToggleComplete={toggleComplete}
            categoryDisplayName={
              item.categoryCode
                ? getSubjectDisplayName(item.categoryCode, subjectAliases)
                : undefined
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor="#FFFFFF"
          />
        }
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          completedAssignments.length > 0 ? (
            <View style={styles.completedSection}>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowCompleted(!showCompleted)}
              >
                <Ionicons
                  name={showCompleted ? "chevron-down" : "chevron-forward"}
                  size={16}
                  color="#555"
                />
                <Text style={styles.toggleButtonText}>
                  完了済みの課題を表示 ({completedAssignments.length})
                </Text>
              </TouchableOpacity>

              {showCompleted && (
                <View style={styles.completedList}>
                  {completedAssignments.map((item) => (
                    <AssignmentCard
                      key={item.uid}
                      assignment={item}
                      onToggleComplete={toggleComplete}
                      categoryDisplayName={
                        item.categoryCode
                          ? getSubjectDisplayName(
                              item.categoryCode,
                              subjectAliases,
                            )
                          : undefined
                      }
                    />
                  ))}
                </View>
              )}
              {/* フッターのパディング調整 */}
              <View style={{ height: 40 }} />
            </View>
          ) : null
        }
      />
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
    color: "#FFFFFF", // White
    textShadowColor: "rgba(0,0,0,0.5)", // Dark shadow
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 36,
    color: "#A0A0A0", // Secondary
  },
  listContent: {
    paddingBottom: 100,
  },
  completedSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  completedList: {
    marginTop: 8,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  toggleButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#A0A0A0",
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
    textShadowRadius: 3,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    color: "#D1D5DB",
  },
  setupButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB", // Stronger Blue
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  setupButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)", // Glass button
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#FFFFFF",
  },
});
