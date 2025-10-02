import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Portal,
  Modal,
  Text,
  IconButton,
  Button,
  Divider,
} from "react-native-paper";

export type FiltersDrawerProps = {
  title?: string;
  visible: boolean;
  onDismiss: () => void;
  onReset?: () => void;
  onApply?: () => void;
  children: React.ReactNode;
  maxHeight?: number;
};

const DEFAULT_MAX_HEIGHT = 620;

export default function FiltersDrawer({
  title = "Filters",
  visible,
  onDismiss,
  onReset,
  onApply,
  children,
  maxHeight = DEFAULT_MAX_HEIGHT,
}: FiltersDrawerProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalContainer, { maxHeight }]}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.titleText}>
            {title}
          </Text>
          <IconButton icon="close" onPress={onDismiss} />
        </View>
        <Divider style={styles.divider} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        <Divider style={styles.divider} />
        <View style={styles.footer}>
          {onReset && (
            <Button
              mode="text"
              onPress={onReset}
              textColor="#4A4A4A"
              style={styles.resetButton}
            >
              Reset
            </Button>
          )}
          {onApply && (
            <Button mode="contained" onPress={onApply} style={styles.applyButton}>
              Apply
            </Button>
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    marginHorizontal: 16,
    marginVertical: 32,
    borderRadius: 20,
    backgroundColor: "#fff",
    paddingBottom: 12,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  titleText: {
    fontWeight: "600",
    color: "#21281B",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E9E0",
  },
  content: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingVertical: 12,
    gap: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  resetButton: {
    borderRadius: 999,
  },
  applyButton: {
    borderRadius: 999,
    backgroundColor: "#91B275",
  },
});
