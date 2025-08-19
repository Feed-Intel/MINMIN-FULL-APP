import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  ScrollView,
  FlatList,
  Modal,
} from "react-native";
import { Text, Appbar, Divider, Snackbar, Button } from "react-native-paper"; // Added Button
import { RelativePathString, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import BookmarkIcon from "@/assets/icons/bookmark.svg";
import { useGetUser, useUpdateProfile } from "@/services/mutation/authMutation";
import { useGetLoyalties } from "@/services/mutation/loyaltyApi";
import { useAuth } from "@/context/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import TermsAndCondition from "@/assets/icons/terms_and_condition.svg";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useGetBookMarks } from "@/services/mutation/feedMutation";
import { i18n } from "@/app/_layout";
import { useDispatch } from "react-redux";
import { setLanguage } from "@/lib/reduxStore/localeSlice";

const ProfileScreen = () => {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobile = width < 768 || Platform.OS !== "web";
  const isSmallMobile = width < 400;

  const [localImage, setLocalImage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false); // New state for language modal

  const { user: userInfo, signOut } = useAuth();
  const { data: user } = useGetUser(userInfo?.id || userInfo?.user_id);
  const { data: customerLoyalty } = useGetLoyalties(
    userInfo?.id || userInfo?.user_id || ""
  );
  const { data: savedPosts = [] } = useGetBookMarks();
  const { mutate: updateUser } = useUpdateProfile();

  const dispatch = useDispatch();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setLocalImage(result.assets[0].uri);
      const formData = new FormData();
      formData.append("id", user?.id?.toString() ?? "");

      const uri = result.assets[0].uri;
      let fileName = "profile.jpg";
      let mimeType = "image/jpeg";

      if (Platform.OS === "web") {
        let webMimeType = "image/jpeg";
        let webFileName = "profile.jpg";
        const dataUrlMatch = uri.match(
          /^data:(image\/[a-zA-Z0-9.+-]+);base64,/
        );
        if (dataUrlMatch) {
          webMimeType = dataUrlMatch[1];
          const ext = webMimeType.split("/")[1];
          webFileName = `profile.${ext}`;
        }
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], webFileName, { type: webMimeType });
        formData.append("image", file);
      } else {
        if (result.assets[0].fileName) fileName = result.assets[0].fileName;
        if (result.assets[0].type) mimeType = result.assets[0].type;
        formData.append("image", {
          uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      updateUser(formData, {
        onSuccess: () => setIsSuccess(true),
        onError: (error) => {
          console.error("Update error:", error);
          if (error.response) {
            console.error("Response data:", error.response.data);
          }
        },
      });
    } else {
      console.error("Image picker canceled or no asset.");
    }
  };

  const handleLogout = async () => {
    try {
      signOut();
      router.replace("/(auth)/" as any);
    } catch (error) {
      console.error(i18n.t("logout_error_message"), error);
    }
  };

  const handleChangeLanguage = (locale: string) => {
    dispatch(setLanguage(locale));
    setShowLanguageModal(false);
  };

  const accountSettings = [
    {
      id: 2,
      label: i18n.t("language_setting"),
      icon: "language",
      action: () => setShowLanguageModal(true),
    },
    { id: 3, label: i18n.t("help_support_setting"), icon: "help-outline" },
    {
      id: 4,
      label: i18n.t("privacy_policy_setting"),
      icon: "shield-outline",
      action: () =>
        Platform.OS === "web"
          ? window.open("https://alpha.feed-intel.com/privacy/", "_blank")
          : router.push({
              pathname:
                "/(protected)/profile/WebPageView" as RelativePathString,
              params: {
                title: i18n.t("privacy_policy_setting"),
                url: "https://alpha.feed-intel.com/privacy/",
              },
            }),
    },
    {
      id: 5,
      label: i18n.t("terms_conditions_setting"),
      icon: "description",
      action: () =>
        Platform.OS === "web"
          ? window.open("https://alpha.feed-intel.com/terms/", "_blank")
          : router.push({
              pathname:
                "/(protected)/profile/WebPageView" as RelativePathString,
              params: {
                title: i18n.t("terms_conditions_setting"),
                url: "https://alpha.feed-intel.com/terms/",
              },
            }),
    },
    {
      id: 6,
      label: i18n.t("log_out_setting"),
      icon: "logout",
      action: handleLogout,
    },
  ];

  const navigateToSavedPosts = () => {
    router.push("/(protected)/saved-posts");
  };

  const renderSavedPost = ({ item }: { item: any }) => (
    <Image source={{ uri: item.image }} style={styles.savedPostImage} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={[styles.header, isMobile && styles.mobileHeader]}>
        <Appbar.BackAction onPress={() => router.push("/(protected)/feed")} />
        <Appbar.Content
          title={i18n.t("profile_screen_title") as string}
          titleStyle={[
            styles.headerTitle,
            isSmallMobile && styles.smallHeaderTitle,
          ]}
        />
      </Appbar.Header>

      <Divider style={styles.divider} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isWeb && styles.webScrollContent,
        ]}
      >
        <View
          style={[
            styles.contentContainer,
            isMobile && styles.mobileContentContainer,
          ]}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={pickImage}
              style={styles.profileImageContainer}
            >
              <Image
                source={
                  localImage
                    ? { uri: localImage }
                    : user?.image
                    ? { uri: user.image.replace("http://", "https://") }
                    : require("@/assets/images/avatar.jpg")
                }
                style={styles.profileImage}
              />
              <View style={styles.editIcon}>
                <MaterialIcons name="edit" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>
              {user?.full_name || i18n.t("default_user_name")}{" "}
            </Text>

            <View style={styles.loyaltyContainer}>
              <Text style={styles.loyaltyLabel}>
                {i18n.t("loyalty_points_label")}{" "}
              </Text>
              <Text style={styles.loyaltyValue}>
                {customerLoyalty?.[0]?.global_points || 0}
              </Text>
            </View>
          </View>

          {/* Saved Posts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <BookmarkIcon width={22} height={22} fill="#666" />
                <Text style={styles.sectionTitle}>
                  {i18n.t("saved_posts_section_title")}{" "}
                </Text>
              </View>
              <TouchableOpacity onPress={navigateToSavedPosts}>
                <MaterialIcons
                  name="keyboard-arrow-right"
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>

            {savedPosts.length > 0 ? (
              <FlatList
                horizontal
                data={savedPosts}
                renderItem={renderSavedPost}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.savedPostsContainer}
                showsHorizontalScrollIndicator={false}
              />
            ) : (
              <Text style={styles.noPostsText}>
                {i18n.t("no_saved_posts_text")}{" "}
              </Text>
            )}
          </View>

          {/* Account Settings Section */}
          <Text style={styles.sectionTitle}>
            {i18n.t("account_settings_section_title")}{" "}
          </Text>
          <View style={styles.menuContainer}>
            {accountSettings.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.action}
              >
                <View style={styles.menuItemContent}>
                  {item.icon == "description" && (
                    <TermsAndCondition
                      width={24}
                      height={24}
                      fill={"#2E18149E"}
                    />
                  )}
                  {item.icon != "shield-outline" &&
                    item.icon != "description" && (
                      <MaterialIcons
                        name={item.icon as any}
                        size={24}
                        color="#2E18149E"
                      />
                    )}
                  {item.icon == "shield-outline" && (
                    <TouchableOpacity
                      onPress={() =>
                        Platform.OS === "web"
                          ? window.open(
                              "https://alpha.feed-intel.com/privacy/",
                              "_blank"
                            )
                          : router.push({
                              pathname:
                                "/(protected)/profile/WebPageView" as RelativePathString,
                              params: {
                                title: i18n.t("terms_conditions_setting"),
                                url: "https://alpha.feed-intel.com/privacy/",
                              },
                            })
                      }
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color="#2E18149E"
                      />
                    </TouchableOpacity>
                  )}
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                {item.id !== 6 && (
                  <MaterialIcons
                    name="keyboard-arrow-right"
                    size={24}
                    color="#b2b2b2"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={isSuccess}
        onDismiss={() => setIsSuccess(false)}
        style={styles.snackbar}
        duration={3000}
        action={{
          label: i18n.t("ok_button"),
          onPress: () => setIsSuccess(false),
        }}
      >
        {i18n.t("profile_picture_updated_success")}{" "}
      </Snackbar>

      {/* Language Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {i18n.t("select_language_title")}
            </Text>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.locale === "en" && styles.selectedLanguageOption,
              ]}
              onPress={() => handleChangeLanguage("en")}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  i18n.locale === "en" && styles.selectedLanguageOptionText,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                i18n.locale === "am" && styles.selectedLanguageOption,
              ]}
              onPress={() => handleChangeLanguage("am")}
            >
              <Text
                style={[
                  styles.languageOptionText,
                  i18n.locale === "am" && styles.selectedLanguageOptionText,
                ]}
              >
                አማርኛ
              </Text>
            </TouchableOpacity>
            <Button
              onPress={() => setShowLanguageModal(false)}
              mode="outlined"
              style={styles.modalCloseButton}
            >
              {i18n.t("cancel_button")}
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  webScrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    backgroundColor: "#FAF3E9",
    elevation: 0,
    shadowOpacity: 0,
    height: 80,
    paddingHorizontal: 24,
  },
  mobileHeader: {
    height: 56,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    alignSelf: "center",
    marginLeft: -30,
  },
  smallHeaderTitle: {
    fontSize: 20,
  },
  contentContainer: {
    paddingTop: 24,
    maxWidth: 1200,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 16,
  },
  mobileContentContainer: {
    paddingHorizontal: 8,
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
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  loyaltyContainer: {
    backgroundColor: "#FAF3E9",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 24,
  },
  loyaltyLabel: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loyaltyValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2d3436",
    textAlign: "center",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 0,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: "#2d3436",
  },
  savedPostsContainer: {
    paddingVertical: 5,
  },
  savedPostImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  noPostsText: {
    textAlign: "center",
    color: "#888",
    paddingVertical: 20,
  },
  settingItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingText: {
    fontSize: 16,
  },
  logoutButton: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  logoutText: {
    color: "#d32f2f",
  },
  divider: {
    backgroundColor: "#e0e0e0",
    height: 1,
  },
  snackbar: {
    margin: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 20px rgba(0,0,0,0.2)",
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  languageOption: {
    width: "100%",
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedLanguageOption: {
    backgroundColor: "#96B76E",
    borderColor: "#96B76E",
  },
  languageOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  selectedLanguageOptionText: {
    color: "white",
  },
  modalCloseButton: {
    marginTop: 10,
    width: "100%",
    borderColor: "#96B76E",
  },
});

export default ProfileScreen;
