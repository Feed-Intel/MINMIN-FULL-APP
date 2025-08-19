import {
  useGetLoyaltyConversionRate,
  useGetLoyaltySettings,
  useUpdateLoyaltySettings,
} from "@/services/mutation/loyaltyMutation";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";

const LoyaltySettingsScreen = () => {
  const [thresholdPoints, setThresholdPoints] = useState<number | null>(null);
  const [conversionRate, setConversionRate] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetLoyaltySettings();
  const { data: settingsConversion, isLoading: isConversionLoading } =
    useGetLoyaltyConversionRate();
  const { mutate: updateSettings, isPending } = useUpdateLoyaltySettings();
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    if (settings) {
      setThresholdPoints(settings.threshold);
    }
    if (settingsConversion) {
      setConversionRate(settingsConversion.global_to_restaurant_rate);
    }
  }, [settings, settingsConversion]);

  const handleUpdateSettings = async () => {
    updateSettings(
      {
        threshold: thresholdPoints,
        global_to_restaurant_rate: conversionRate,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["loyaltySettings"] });
          queryClient.invalidateQueries({
            queryKey: ["loyaltyConversionRate"],
          });
          setSnackbarMessage("Settings updated successfully");
        },
        onError: () => {
          setSnackbarMessage("Failed to update settings");
        },
      }
    );
  };

  const handleCancel = () => {
    if (settings) {
      setThresholdPoints(settings.threshold);
    }
    if (settingsConversion) {
      setConversionRate(settingsConversion.global_to_restaurant_rate);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {isLoading || isConversionLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} color="#91B275" size="large" />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <Text style={styles.pageTitle}>Loyalty point</Text>

          <Text style={styles.inputLabel}>threshold point for redemption</Text>
          <TextInput
            mode="outlined"
            value={thresholdPoints?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              setThresholdPoints(numericValue ? Number(numericValue) : 0);
            }}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />

          <Text style={styles.inputLabel}>Conversion rate</Text>
          <TextInput
            mode="outlined"
            value={conversionRate?.toString()}
            keyboardType="numeric"
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              setConversionRate(numericValue ? Number(numericValue) : 0);
            }}
            style={styles.input}
            outlineStyle={styles.inputOutline}
            contentStyle={styles.inputContent}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleUpdateSettings}
              loading={isPending}
              style={styles.saveButton}
              labelStyle={styles.buttonLabel}
            >
              Save Changes
            </Button>
            <Button
              mode="outlined" // Changed to outlined for a ghost button effect
              onPress={handleCancel}
              style={styles.cancelButton}
              labelStyle={[styles.buttonLabel, styles.cancelButtonLabel]}
              textColor="#91B275" // Match the border color
            >
              Cancel
            </Button>
          </View>
        </View>
      )}
      <Snackbar
        visible={Boolean(snackbarMessage)}
        onDismiss={() => setSnackbarMessage("")}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20, // Adjusted padding
    paddingVertical: 20,
    backgroundColor: "#EFF4EB", // Background color matching the image
  },
  contentWrapper: {
    width: "100%",
    alignSelf: "center", // Center content if ScrollView is wider
  },
  pageTitle: {
    fontSize: 24, // Larger font size for the title
    fontWeight: "bold",
    color: "#333", // Darker text color
    marginBottom: 30, // More space below the title
  },
  inputLabel: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5, // Space between label and input
    textTransform: "capitalize", // Capitalize the label text as in the image
  },
  input: {
    marginBottom: 20, // More space below each input
    backgroundColor: "#50693A17", // Lighter background for the input field
    borderRadius: 8, // Slightly rounded corners
  },
  inputOutline: {
    borderColor: "#5A6E4933", // Lighter border color for the outlined input
    borderRadius: 8,
    borderWidth: 1,
  },
  inputContent: {
    paddingVertical: 5, // Adjust padding inside the text input
    color: "#202B1866",
  },
  buttonContainer: {
    flexDirection: "row", // Arrange buttons horizontally
    justifyContent: "flex-start", // Align buttons to the start (left)
    marginTop: 20, // Space above the buttons
    gap: 15, // Space between buttons
  },
  saveButton: {
    backgroundColor: "#91B275", // Green color for Save Changes
    borderRadius: 20, // Rounded corners for button
    paddingHorizontal: 15, // Padding inside button
    paddingVertical: 2, // Vertical padding to make it less tall
  },
  cancelButton: {
    borderColor: "#5A6E4933", // Green border for Cancel button
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 2,
    backgroundColor: "transparent",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButtonLabel: {
    color: "#91B275", // Green text color for Cancel button
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  snackbar: {
    backgroundColor: "#333", // Darker background for snackbar
    marginBottom: 20, // Position higher from bottom if needed
  },
});

export default LoyaltySettingsScreen;
