import { LinearGradient } from "expo-linear-gradient";
import React, { ReactNode } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BackgroundGradientProps {
  children: ReactNode;
}

const { width } = Dimensions.get("window");

export function BackgroundGradient({ children }: BackgroundGradientProps) {
  return (
    <View style={styles.container}>
      {/* メインのグラデーション背景 (Deep Night Sky) */}
      <LinearGradient
        colors={["#0F0C29", "#302B63", "#24243E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 装飾用の光（Glow effects） */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />

      {/* コンテンツエリア */}
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0C29",
  },
  safeArea: {
    flex: 1,
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.25, // 控えめな発光感
  },
  circle1: {
    width: width * 0.9,
    height: width * 0.9,
    backgroundColor: "#7B4397", // Deep Purple Glow
    top: -width * 0.3,
    left: -width * 0.2,
  },
  circle2: {
    width: width * 0.8,
    height: width * 0.8,
    backgroundColor: "#00d2ff", // Cyan Glow
    bottom: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.15,
  },
});
