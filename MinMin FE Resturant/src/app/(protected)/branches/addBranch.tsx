import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import {
  TextInput,
  Button,
  Switch,
  Text,
  Appbar,
  Snackbar,
  HelperText,
  Portal,
  Dialog,
} from "react-native-paper";
import { useCreateBranch } from "@/services/mutation/branchMutation";

interface AddBranchDialogProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBranchDialog({
  visible,
  onClose,
  onSuccess,
}: AddBranchDialogProps) {
  const [branchData, setBranchData] = useState({
    address: "",
    lat: "",
    lng: "",
    is_default: false,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSnackbar, setShowSnackbar] = useState(false);

  const { mutateAsync: addBranch, isPending } = useCreateBranch();

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!branchData.address.trim()) {
      errors.address = "Address is required.";
    } else if (branchData.address.trim().length < 3) {
      errors.address = "Address must be at least 3 characters long.";
    }

    if (!branchData.lat.trim()) {
      errors.lat = "Latitude is required.";
    }
    if (!branchData.lng.trim()) {
      errors.lng = "Longitude is required.";
    }
    const latitude = parseFloat(branchData.lat.trim());
    const longitude = parseFloat(branchData.lng.trim());
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.lat = "Latitude must be between -90 and 90";
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.lng = "Longitude must be between -180 and 180";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      try {
        await addBranch({
          ...branchData,
          gps_coordinates: `${branchData.lat},${branchData.lng}`
        });
        setBranchData({ address: "", lat: "", lng: "", is_default: false });
        setShowSnackbar(true);
        onSuccess();
      } catch (error) {
        console.error("Error adding branch:", error);
        setErrors({ general: "Failed to add branch. Please try again." });
      }
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        {/* <Dialog.Title>Add New Branch</Dialog.Title> */}
        <Dialog.Content>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView>
              <TextInput
                placeholder="Address"
                mode="outlined"
                value={branchData.address}
                onChangeText={(text) =>
                  setBranchData({ ...branchData, address: text })
                }
                style={styles.input}
                error={!!errors.address}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.address}>
                {errors.address}
              </HelperText>

              <TextInput
                placeholder="Latitude"
                mode="outlined"
                value={branchData.lat}
                onChangeText={(text) => {
                  const sanitizedValue = text.replace(/[^0-9\-,\.]/g, "");
                  setBranchData({
                    ...branchData,
                    lat: sanitizedValue,
                  });
                }}
                style={styles.input}
                error={!!errors.lat}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.lat}>
                {errors.lat}
              </HelperText>

              <TextInput
                placeholder="Longitude"
                mode="outlined"
                value={branchData.lng}
                onChangeText={(text) => {
                  const sanitizedValue = text.replace(/[^0-9\-,\.]/g, "");
                  setBranchData({
                    ...branchData,
                    lng: sanitizedValue,
                  });
                }}
                style={styles.input}
                error={!!errors.lng}
                outlineStyle={{
                  borderColor: '#91B275',
                  borderWidth: 0,
                  borderRadius: 16,
                }}
                placeholderTextColor="#202B1866"
              />
              <HelperText type="error" visible={!!errors.lng}>
                {errors.lng}
              </HelperText>

              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Set as Default</Text>
                <Switch
                  value={branchData.is_default}
                  onValueChange={(value) =>
                    setBranchData({ ...branchData, is_default: value })
                  }
                  color="#96B76E"
                  trackColor={{ false: "#96B76E", true: "#96B76E" }}
                  thumbColor={"#fff"}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Dialog.Content>
        <Dialog.Actions>
          {/* <Button onPress={onClose}>Cancel</Button> */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isPending}
            disabled={isPending}
            style={{
              borderRadius: 16,
              height: 36,
              backgroundColor: '#96B76E',
            }}
            labelStyle={{
              color: '#fff',
              fontSize: 15,
            }}
          >
            Save Branch
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Snackbar
        visible={showSnackbar || !!errors.general}
        onDismiss={() => {
          setShowSnackbar(false);
          setErrors({ ...errors, general: "" });
        }}
        duration={3000}
      >
        {showSnackbar && !errors.general
          ? "Branch added successfully!"
          : errors.general || "Please fix the errors in the form."}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: "#EFF4EB",
    width: "40%",
    alignSelf: "center",
    borderRadius: 12,
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#91B27517',
    borderWidth: 0,
    borderColor: '#91B275',
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
  },
  switchText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#40392B",
  },
});