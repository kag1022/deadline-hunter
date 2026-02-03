import { Colors } from "@/constants/theme";
import { useCountdown } from "@/hooks/use-countdown";
import { Assignment } from "@/types/assignment";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { BlurView } from "expo-blur";
import React, { useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AssignmentCardProps {
  assignment: Assignment;
  onToggleComplete: (uid: string) => void;
  /** 科目コードの表示名（エイリアスまたはコード） */
  categoryDisplayName?: string;
}

/**
 * 課題カードコンポーネント
 * Dark Glassmorphismデザイン適用
 */
export function AssignmentCard({
  assignment,
  onToggleComplete,
  categoryDisplayName,
}: AssignmentCardProps) {
  const countdown = useCountdown(assignment.deadline);

  // アニメーション用の値
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // 完了トグル処理（アニメーション付き）
  const handleToggle = () => {
    if (!assignment.isCompleted) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onToggleComplete(assignment.uid);
      });
    } else {
      onToggleComplete(assignment.uid);
    }
  };

  // 残り時間に応じた色を決定
  const getStatusColor = () => {
    if (countdown.isExpired) return Colors.dark.textSecondary; // #A0A0A0
    if (countdown.isUrgent) return Colors.dark.status.urgent; // #FF4B4B
    if (countdown.isWarning) return Colors.dark.status.warning; // #FFD700
    return Colors.dark.status.safe; // #00E676
  };

  const statusColor = getStatusColor();
  const deadlineText = format(
    new Date(assignment.deadline),
    "M月d日(E) HH:mm",
    { locale: ja },
  );

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ scale }] }]}
    >
      <BlurView intensity={40} tint="dark" style={styles.blurCard}>
        {/* 左側のステータスバー */}
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

        <View style={styles.content}>
          {/* 科目コードチップ */}
          {categoryDisplayName && (
            <View style={styles.categoryChipWrapper}>
              <View style={styles.categoryChip}>
                <Ionicons
                  name="pricetag"
                  size={10}
                  color="#E0E0E0" // Light Grey
                  style={styles.chipIcon}
                />
                <Text style={styles.chipText}>{categoryDisplayName}</Text>
              </View>
            </View>
          )}

          {/* 課題名 */}
          <Text
            style={[
              styles.title,
              assignment.isCompleted && styles.textCompleted,
            ]}
            numberOfLines={2}
          >
            {assignment.summary}
          </Text>

          {/* フッター情報 */}
          <View style={styles.footerColumn}>
            {/* 期限日時 */}
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color="#A0A0A0"
                style={styles.infoIcon}
              />
              <Text style={styles.deadline}>{deadlineText}</Text>
            </View>

            {/* カウントダウン */}
            <View style={styles.countdownContainer}>
              <Text style={[styles.countdown, { color: statusColor }]}>
                {countdown.displayText}
              </Text>
            </View>
          </View>
        </View>

        {/* 完了チェックボックス */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={handleToggle}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View
            style={[
              styles.checkbox,
              assignment.isCompleted && styles.checkboxChecked,
            ]}
          >
            {assignment.isCompleted && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    // シャドウ設定 (Glow effect)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: "transparent",
  },
  blurCard: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1, // 1px border
    borderColor: "rgba(255, 255, 255, 0.15)", // Subtle border
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Slight tint
  },
  statusBar: {
    width: 4, // Slightly thinner
    height: "100%",
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  categoryChipWrapper: {
    flexDirection: "row",
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#E0E0E0", // White-ish
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF", // Pure white
    marginBottom: 8,
    lineHeight: 24,
    textShadowColor: "rgba(0, 0, 0, 0.8)", // Black shadow for contrast
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  textCompleted: {
    textDecorationLine: "line-through",
    opacity: 0.4,
  },
  footerColumn: {
    flexDirection: "column",
    marginTop: 6,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: 6,
  },
  deadline: {
    fontSize: 14,
    color: "#D1D5DB", // Light Grey (Gray-300)
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countdownContainer: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Darker background for contrast
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  countdown: {
    fontSize: 14,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  checkboxContainer: {
    justifyContent: "center",
    paddingRight: 16,
    paddingLeft: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  checkboxChecked: {
    backgroundColor: "#00E676", // Safe Color
    borderColor: "#00E676",
  },
});
