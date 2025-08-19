import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Card,
  Title,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTenantProfile,
  useUpdateTenantProfile,
  useUpdateTenantProfileImage,
} from "@/services/mutation/tenantMutation";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { base64ToBlob } from "@/util/imageUtils";

const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const tenantId = useAppSelector((state) => state.auth.restaurant?.id);
  const { data: tenant, isLoading } = useGetTenantProfile(tenantId!);
  const { mutate: updateProfile, isPending } = useUpdateTenantProfile();
  const { mutate: updateProfileImage } = useUpdateTenantProfileImage();
  const [localImage, setLocalImage] = useState<string | null>(null);
  // State variables
  const [restaurantName, setRestaurantName] = useState("");
  const [profile, setProfile] = useState("");
  const [maxDiscount, setMaxDiscount] = useState<number | null>(null);
  const [chapaPaymentApiKey, setChapaPaymentApiKey] = useState("");
  const [chapaPaymentPublicKey, setChapaPaymentPublicKey] = useState("");
  const [taxPercentage, setTaxPercentage] = useState<number | null>(null);
  const [serviceChargePercentage, setServiceChargePercentage] = useState<
    number | null
  >(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Responsive breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  useEffect(() => {
    if (tenant) {
      setRestaurantName(tenant.restaurant_name);
      setProfile(tenant.profile);
      setLocalImage(tenant.image);
      setMaxDiscount(tenant.max_discount_limit);
      setChapaPaymentApiKey(tenant.CHAPA_API_KEY);
      setChapaPaymentPublicKey(tenant.CHAPA_PUBLIC_KEY);
      setTaxPercentage(tenant.tax);
      setServiceChargePercentage(tenant.service_charge);
    }
  }, [tenant]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setLocalImage(result.assets[0].uri);
      const formData = new FormData();
      const asset = result.assets[0];
      const fileType = asset.type || "image/jpeg";
      const fileName = asset.fileName || "image.jpg";
      const imageName = Date.now() + "." + fileName?.split(".")[1];
      formData.append("id", tenantId!);
      if (Platform.OS === "web") {
        const blob = base64ToBlob(asset.uri, fileType);
        formData.append(
          "image",
          new File([blob], imageName, { type: fileType })
        );
      } else {
        formData.append("image", {
          uri: result.assets[0].uri,
          name: `image.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }
      updateProfileImage(formData, {
        onSuccess: () => setSnackbarMessage("Profile updated successfully"),
      });
    }
  };

  const handleUpdateProfile = () => {
    updateProfile(
      {
        id: tenantId!,
        restaurant_name: restaurantName,
        profile,
        max_discount_limit: maxDiscount,
        CHAPA_API_KEY: chapaPaymentApiKey,
        CHAPA_PUBLIC_KEY: chapaPaymentPublicKey,
        tax: taxPercentage,
        service_charge: serviceChargePercentage,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["tenantProfile"] });
          setSnackbarMessage("Profile updated successfully");
        },
        onError: () => {
          setSnackbarMessage("Failed to update profile");
        },
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View
        style={[
          styles.container,
          {
            width: isSmallScreen ? "90%" : isMediumScreen ? "70%" : "50%",
            maxWidth: 800,
            padding: isSmallScreen ? 16 : 24,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size={isSmallScreen ? "large" : "small"} />
        ) : (
          <Card style={styles.card}>
            <Card.Content style={styles.content}>
              <Title
                style={[styles.title, { fontSize: isSmallScreen ? 20 : 24 }]}
              >
                Restaurant Profile
              </Title>

              <View style={styles.profileSection}>
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.profileImageContainer}
                >
                  <Image
                    source={
                      localImage
                        ? { uri: localImage }
                        : require("@/assets/images/avatar.jpg")
                    }
                    style={styles.profileImage}
                  />
                  <View style={styles.editIcon}>
                    <MaterialIcons name="edit" size={20} color="#FFF" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Restaurant Name"
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Profile Description"
                  value={profile}
                  onChangeText={setProfile}
                  style={styles.input}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Chapa Payment API Key"
                  value={chapaPaymentApiKey}
                  onChangeText={setChapaPaymentApiKey}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Chapa Public Key"
                  value={chapaPaymentPublicKey}
                  onChangeText={setChapaPaymentPublicKey}
                  style={styles.input}
                  mode="outlined"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  label="Tax Percentage"
                  value={taxPercentage?.toString() || ""}
                  keyboardType="numeric"
                  onChangeText={(text) => setTaxPercentage(Number(text))}
                  style={styles.input}
                  mode="outlined"
                />
                <TextInput
                  label="Service Charge Percentage"
                  value={serviceChargePercentage?.toString() || ""}
                  keyboardType="numeric"
                  onChangeText={(text) =>
                    setServiceChargePercentage(Number(text))
                  }
                  style={styles.input}
                  mode="outlined"
                />
              </View>

              <TextInput
                label="Max Discount Limit"
                value={maxDiscount?.toString() || ""}
                keyboardType="numeric"
                onChangeText={(text) => setMaxDiscount(Number(text))}
                style={styles.input}
                mode="outlined"
              />

              <Button
                mode="contained"
                onPress={handleUpdateProfile}
                loading={isPending}
                style={styles.button}
                labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
                contentStyle={{ height: isSmallScreen ? 48 : 56 }}
              >
                Save Profile
              </Button>
            </Card.Content>
          </Card>
        )}

        <Snackbar
          visible={Boolean(snackbarMessage)}
          onDismiss={() => setSnackbarMessage("")}
          duration={3000}
          style={[
            styles.snackbar,
            {
              marginBottom: isSmallScreen ? 16 : 24,
              marginHorizontal: isSmallScreen ? 16 : 0,
            },
          ]}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    alignSelf: "center",
    paddingTop: 24,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 12,
    padding: 8,
  },
  content: {
    gap: 16,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#EE8429",
    borderRadius: 15,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontWeight: "600",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  input: {
    flex: 1,
    minWidth: 150,
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
  snackbar: {
    borderRadius: 8,
  },
});

export default ProfileScreen;
