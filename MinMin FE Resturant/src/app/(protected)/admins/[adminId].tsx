import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import {
  TextInput,
  Button,
  Snackbar,
  Appbar,
  ActivityIndicator,
  HelperText,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { BranchAdmin } from "@/types/branchAdmin";
import {
  useGetBranchAdmin,
  useUpdateBranchAdmin,
} from "@/services/mutation/branchAdminMutation";
import { Dropdown } from "react-native-paper-dropdown";
import { useGetBranches } from "@/services/mutation/branchMutation";

export default function EditAdminScreen() {
  const navigation = useRouter();
  const { adminId } = useLocalSearchParams();
  const queryClient = useQueryClient();
  const [updateBranchAdmin, setUpdateBranchAdmin] = useState<BranchAdmin>();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { width } = useWindowDimensions();

  const {
    data: admin,
    isLoading: isFetching,
    isSuccess,
  } = useGetBranchAdmin(Array.isArray(adminId) ? adminId[0] : adminId);
  const { data: branches } = useGetBranches();

  useEffect(() => {
    if (isSuccess) {
      setUpdateBranchAdmin({
        ...admin,
        branch: (typeof admin.branch === "object"
          ? admin.branch.id
          : admin.branch) as any,
      });
    }
  }, [isSuccess]);

  const onSuccessEdit = () => {
    queryClient.invalidateQueries({ queryKey: ["branchAdmins"] });
    setSnackbarVisible(true);
    navigation.back();
  };

  const onErrorEdit = () => {
    setErrors({ general: "Failed to update admin. Please try again." });
  };

  const { mutate: editBranchAdmin, isPending: isUpdating } =
    useUpdateBranchAdmin(onSuccessEdit, onErrorEdit);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!updateBranchAdmin?.full_name?.trim()) {
      errors.full_name = "Full name is required.";
    }

    if (!updateBranchAdmin?.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(updateBranchAdmin.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!updateBranchAdmin?.phone?.trim()) {
      errors.phone = "Phone number is required.";
    } else if (
      updateBranchAdmin.phone.length < 10 ||
      updateBranchAdmin.phone.length > 15
    ) {
      errors.phone = "Phone number must be between 10 and 15 digits.";
    }

    if (!updateBranchAdmin?.branch) {
      errors.branch = "Branch is required.";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditAdmin = () => {
    if (validateForm()) {
      if (updateBranchAdmin?.branch) {
        editBranchAdmin({ ...admin, ...updateBranchAdmin });
      } else {
        setErrors({ ...errors, branch: "Branch is required." });
      }
    }
  };

  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.back()} />
        <Appbar.Content title="Edit Admin" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View
          style={[
            styles.container,
            {
              width: width > 768 ? "50%" : "90%",
            },
          ]}
        >
          <TextInput
            label="Full Name"
            value={updateBranchAdmin?.full_name || ""}
            onChangeText={(text) =>
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, full_name: text } : undefined
              )
            }
            style={styles.input}
            mode="outlined"
            error={!!errors.full_name}
          />
          <HelperText type="error" visible={!!errors.full_name}>
            {errors.full_name}
          </HelperText>

          <TextInput
            label="Email"
            value={updateBranchAdmin?.email || ""}
            onChangeText={(text) =>
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, email: text } : undefined
              )
            }
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            error={!!errors.email}
          />
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>

          <TextInput
            label="Phone"
            value={updateBranchAdmin?.phone || ""}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, phone: numericValue } : undefined
              );
            }}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
            error={!!errors.phone}
          />
          <HelperText type="error" visible={!!errors.phone}>
            {errors.phone}
          </HelperText>

          <Dropdown
            label="User Branch"
            placeholder="Select Branch Assigned to User"
            options={
              branches?.map((branch: any) => ({
                label: branch.address,
                value: branch.id,
              })) || []
            }
            value={
              typeof updateBranchAdmin?.branch === "object"
                ? updateBranchAdmin.branch.id
                : updateBranchAdmin?.branch
            }
            onSelect={(value) =>
              setUpdateBranchAdmin((prevState) =>
                prevState ? { ...prevState, branch: value || "" } : undefined
              )
            }
          />
          <HelperText type="error" visible={!!errors.branch}>
            {errors.branch}
          </HelperText>

          {errors.general && (
            <Snackbar
              visible
              onDismiss={() => setErrors({ ...errors, general: "" })}
            >
              {errors.general}
            </Snackbar>
          )}

          <Button
            mode="contained"
            onPress={handleEditAdmin}
            loading={isUpdating}
            style={styles.button}
            disabled={isUpdating}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Admin updated successfully!
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
