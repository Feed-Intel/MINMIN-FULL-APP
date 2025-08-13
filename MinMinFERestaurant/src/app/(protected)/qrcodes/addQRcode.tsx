import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Modal, Dimensions } from "react-native";
import { Text, Button, Snackbar, Portal,  } from "react-native-paper";
import { router } from "expo-router";
import { useCreateQR, useGetTables } from "@/services/mutation/tableMutation"; // Update to your tables hook
import { Dropdown } from "react-native-paper-dropdown";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 375; // iPhone SE
const isMediumScreen = width >= 375 && width < 768; // Most phones
const isLargeScreen = width >= 768; // Tablets and larger devices

export default function GenerateTableQRCode() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { data: tables = [] } = useGetTables(); // Ensure tables is initialized as an empty array
  const createQRCode = useCreateQR();

  const handleGenerateQR = () => {
    if (!selectedTable) {
      setSnackbarMessage("Please select a table");
      setSnackbarVisible(true);
      return;
    }
    console.log("selectedTable", selectedTable);
    createQRCode.mutate(selectedTable);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Generate Table QR Codes
      </Text>

      <View style={styles.formContainer}>
        <Text style={styles.subtitle}>Select Table:</Text>
        <Dropdown
          label="Tables"
          mode={isSmallScreen ? "flat" : "outlined"}
          value={selectedTable || ""}
          onSelect={(value) => setSelectedTable(value ?? null)}
          options={tables.map((table) => ({
            label: `Table ${table.table_code} - ${typeof table.branch === "object" && table.branch !== null && "address" in table.branch ? table.branch.address : table.branch}`,
            value: table.id!,
          }))}
          // style={styles.dropdown}
          // dropDownItemTextStyle={styles.dropdownItemText}
          // dropDownItemSelectedTextStyle={styles.dropdownItemSelectedText}
        />

        <Button
          mode="contained"
          onPress={handleGenerateQR}
          style={styles.createButton}
          labelStyle={styles.buttonLabel}
        >
          Generate QR Code
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: isSmallScreen ? 12 : isMediumScreen ? 24 : 32,
    paddingVertical: isSmallScreen ? 16 : 24,
    justifyContent: "center",
  },
  formContainer: {
    maxWidth: isLargeScreen ? 600 : "100%",
    alignSelf: "center",
    width: "100%",
  },
  title: {
    textAlign: "center",
    marginBottom: isSmallScreen ? 16 : 24,
    fontSize: isSmallScreen ? 24 : isMediumScreen ? 28 : 32,
    lineHeight: isSmallScreen ? 28 : isMediumScreen ? 32 : 36,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: isSmallScreen ? 16 : 18,
    marginBottom: 12,
    color: "#666",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 16 : 24,
    elevation: 2,
  },
  dropdownItemText: {
    fontSize: isSmallScreen ? 14 : 16,
  },
  dropdownItemSelectedText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: "bold",
  },
  createButton: {
    marginTop: isSmallScreen ? 16 : 24,
    paddingVertical: isSmallScreen ? 8 : 12,
    borderRadius: 8,
    alignSelf: "center",
    width: isSmallScreen ? "100%" : "auto",
    maxWidth: 400,
  },
  buttonLabel: {
    fontSize: isSmallScreen ? 16 : 18,
    paddingVertical: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  qrContainer: {
    backgroundColor: "white",
    padding: isSmallScreen ? 16 : 24,
    borderRadius: 12,
    alignItems: "center",
    width: isSmallScreen ? "90%" : "80%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: isSmallScreen ? 18 : 20,
    marginBottom: 16,
  },
  closeButton: {
    marginTop: 16,
  },
});
