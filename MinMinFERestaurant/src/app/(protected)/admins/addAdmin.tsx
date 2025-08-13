import React, { useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import {
  TextInput,
  Button,
  Snackbar,
  Appbar,
  HelperText,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { BranchAdmin } from "@/types/branchAdmin";
import { useCreateBranchAdmin } from "@/services/mutation/branchAdminMutation";
import { Dropdown } from "react-native-paper-dropdown";
import { useGetBranches } from "@/services/mutation/branchMutation";

const screenWidth = Dimensions.get("window").width;

export default function AddAdminScreen() {
  const navigation = useRouter();
  const queryClient = useQueryClient();

  const [newBranchAdmin, setNewBranchAdmin] = useState<BranchAdmin>({
    id: undefined,
    full_name: "",
    email: "",
    phone: "",
    branch: "",
    password: "Azxvbnhftftftfnj12$",
    created_at: "",
    updated_at: "",
  });
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { data: branches } = useGetBranches();

  const onSuccessAdd = () => {
    queryClient.invalidateQueries({ queryKey: ["branchAdmins"] });
    setSnackbarVisible(true);
    navigation.back();
  };

  const onErrorAdd = () => {
    setErrors({ general: "Failed to add admin. Please try again." });
  };

  const { mutate: addBranchAdmin, isPending } = useCreateBranchAdmin(
    onSuccessAdd,
    onErrorAdd
  );

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!newBranchAdmin.full_name?.trim()) {
      errors.full_name = "Full name is required.";
    }

    if (!newBranchAdmin.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(newBranchAdmin.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!newBranchAdmin.phone?.trim()) {
      errors.phone = "Phone number is required.";
    } else if (
      newBranchAdmin.phone.length < 10 ||
      newBranchAdmin.phone.length > 15
    ) {
      errors.phone = "Phone number must be between 10 and 15 digits.";
    }

    if (!newBranchAdmin.branch) {
      errors.branch = "Branch is required.";
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAdmin = () => {
    if (validateForm()) {
      addBranchAdmin({ ...newBranchAdmin, user_type: "branch" });
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.back()} />
        <Appbar.Content title="Add Admin" />
      </Appbar.Header>
      <View style={styles.container}>
        <TextInput
          label="Full Name"
          value={newBranchAdmin.full_name}
          onChangeText={(fullname) =>
            setNewBranchAdmin({ ...newBranchAdmin, full_name: fullname })
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
          value={newBranchAdmin.email}
          onChangeText={(email) =>
            setNewBranchAdmin({ ...newBranchAdmin, email: email })
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
          value={newBranchAdmin.phone}
          onChangeText={(phone) => {
            const numericValue = phone.replace(/[^0-9]/g, "");
            setNewBranchAdmin({ ...newBranchAdmin, phone: numericValue });
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
            typeof newBranchAdmin.branch === "string"
              ? newBranchAdmin.branch
              : newBranchAdmin.branch?.id
          }
          onSelect={(value) =>
            setNewBranchAdmin({ ...newBranchAdmin, branch: value || "" })
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
          onPress={handleAddAdmin}
          loading={isPending}
          style={styles.button}
          disabled={isPending}
        >
          Add Admin
        </Button>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        Admin added successfully!
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: screenWidth > 600 ? "50%" : "100%", // Responsive width
    alignSelf: "center",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
