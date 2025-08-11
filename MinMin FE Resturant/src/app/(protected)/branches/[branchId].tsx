import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  TextInput,
  Button,
  Switch,
  Text,
  Snackbar,
  HelperText,
  Portal,
  Dialog,
} from "react-native-paper";
import { useUpdateBranch } from "@/services/mutation/branchMutation";

interface EditBranchDialogProps {
  visible: boolean;
  branch: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditBranchDialog({
  visible,
  branch,
  onClose,
  onSuccess,
}: EditBranchDialogProps) {
  const [branchData, setBranchData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showSnackbar, setShowSnackbar] = useState(false);

  const { mutate: updateBranch, isPending } = useUpdateBranch();

  useEffect(() => {
    if (branch) {
      setBranchData({
        ...branch,
        gps_coordinates: branch.gps_coordinates || "",
      });
    }
  }, [branch]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!branchData?.address?.trim()) {
      errors.address = "Address is required.";
    } else if (branchData.address.trim().length < 3) {
      errors.address = "Address must be at least 3 characters long.";
    }

    if (!branchData?.gps_coordinates?.trim()) {
      errors.gps_coordinates = "GPS Coordinates are required.";
    } else {
      const coords = branchData.gps_coordinates.split(",");
      if (coords.length !== 2) {
        errors.gps_coordinates =
          "GPS Coordinates must be in the format: latitude,longitude";
      } else {
        const latitude = parseFloat(coords[0].trim());
        const longitude = parseFloat(coords[1].trim());
        if (
          isNaN(latitude) ||
          isNaN(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          errors.gps_coordinates =
            "Invalid GPS Coordinates. Latitude must be between -90 and 90, and Longitude must be between -180 and 180.";
        }
      }
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = () => {
    if (validateForm() && branchData) {
      updateBranch(branchData);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        {/* <Dialog.Title>Edit Branch</Dialog.Title> */}
        <Dialog.Content>
          <TextInput
            placeholder="Address"
            mode="outlined"
            value={branchData?.address || ""}
            onChangeText={(text) =>
              setBranchData((prev: any) => ({ ...prev, address: text }))
            }
            style={styles.input}
            error={!!errors.address}
            placeholderTextColor="#202B1866"
            outlineStyle={{
              borderColor: '#91B275',
              borderWidth: 0,
              borderRadius: 16,
            }}
            contentStyle={{
              color: '#202B1866',
            }}
          />
          <HelperText type="error" visible={!!errors.address}>
            {errors.address}
          </HelperText>

          <TextInput
  placeholder="GPS Coordinates (e.g., 38.83, 8.98)"
  mode="outlined"
  value={
    typeof branchData?.location === "object"
      ? `${branchData.location.lat}, ${branchData.location.lng}`
      : branchData?.location || ""
  }
  onChangeText={(text) => {
    const sanitizedValue = text.replace(/[^0-9\-,\.]/g, "");
    const [lat, lng] = sanitizedValue.split(",").map(val => val.trim());

    // Convert to object if both values are available
    const location = lat && lng ? { lat, lng } : sanitizedValue;

    setBranchData((prev: any) => ({
      ...prev,
      location,
    }));
  }}
  style={styles.input}
  error={!!errors.location}
  placeholderTextColor="#202B1866"
  outlineStyle={{
    borderColor: '#91B275',
    borderWidth: 0,
    borderRadius: 16,
  }}
  contentStyle={{
    color: '#202B1866',
  }}
/>

          <HelperText type="error" visible={!!errors.location}>
            {errors.location}
          </HelperText>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>Set as Default</Text>
            <Switch
              value={branchData?.is_default || false}
              onValueChange={(value) =>
                setBranchData((prev: any) => ({ ...prev, is_default: value }))
              }
              color="#96B76E"
              trackColor={{ false: "#96B76E", true: "#96B76E" }}
              thumbColor={"#fff"}
            />
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          {/* <Button onPress={onClose}>Cancel</Button> */}
          <Button
            mode="contained"
            onPress={() => updateBranch(branchData)}
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
            Update Branch
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
          ? "Branch updated successfully!"
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
  },
  switchText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#40392B",
  },
});