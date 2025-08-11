import React, { useState, useEffect } from "react";
import { StyleSheet, Image, View, useWindowDimensions, ScrollView } from "react-native";
import { 
  Text, 
  Button, 
  TextInput, 
  Switch, 
  Portal, 
  Dialog,
  Menu 
} from "react-native-paper";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useUpdateMenu } from "@/services/mutation/menuMutation";
import { useQueryClient } from "@tanstack/react-query";
import { base64ToBlob } from "@/util/imageUtils";

interface EditMenuDialogProps {
  visible: boolean;
  menu: any;
  onClose: () => void;
}

export default function EditMenuDialog({ visible, menu, onClose }: EditMenuDialogProps) {
  const { width } = useWindowDimensions();
  const [menuData, setMenuData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    is_side: false,
    image: { uri: "", name: "", type: "" },
  });
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;

  const queryClient = useQueryClient();
  const { mutateAsync: updateMenu, isPending } = useUpdateMenu(menu?.id);

  const categories = ["Appetizer", "Breakfast", "Lunch", "Dinner"];

  useEffect(() => {
    if (menu) {
      setMenuData({
        name: menu.name,
        description: menu.description,
        category: menu.category,
        price: menu.price,
        is_side: menu.is_side,
        image: menu.image
          ? { uri: menu.image, name: "", type: "" }
          : { uri: "", name: "", type: "" },
      });
    }
  }, [menu]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setMenuData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setMenuData({
        ...menuData,
        image: {
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || "image.jpg",
          type: result.assets[0].type || "image/jpeg",
        },
      });
    }
  };

  const handleUpdate = async () => {
    if (!menuData.name || !menuData.image.uri) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please provide a name and select an image",
      });
      return;
    }

    const formData = new FormData();
    Object.entries(menuData).forEach(([key, value]) => {
      if (key !== "image" && typeof value === "string") {
        formData.append(key, value);
      }
    });

    if (menuData.image.uri.includes("data:image")) {
      const base64Data = menuData.image.uri;
      const contentType = menuData.image.type;
      const imageName = Date.now() + "." + menuData.image.name?.split(".")[1];

      const blob = base64ToBlob(base64Data, contentType);
      formData.append(
        "image",
        new File([blob], imageName, { type: contentType })
      );
    }

    await updateMenu(formData);
    queryClient.invalidateQueries({ queryKey: ["menus"] });
    Toast.show({
      type: "success",
      text1: "Success",
      text2: "Menu updated successfully!",
    });
    onClose();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
        {/* <Dialog.Title>Edit Menu Item</Dialog.Title> */}
        <Dialog.Content>
          <ScrollView>
            <TextInput
              label="Name"
              value={menuData.name}
              onChangeText={(text) => handleInputChange("name", text)}
              mode="outlined"
              style={styles.input}
              outlineStyle={{
                borderColor: '#91B275',
                borderWidth: 0,
                borderRadius: 16,
              }}
              placeholderTextColor="#202B1866"
              contentStyle={{
                color: '#202B1866',
              }}
            />

            <TextInput
              label="Description"
              value={menuData.description}
              onChangeText={(text) => handleInputChange("description", text)}
              mode="outlined"
              multiline
              numberOfLines={isSmallScreen ? 3 : 5}
              style={styles.descInput}
              outlineStyle={{
                borderColor: '#91B275',
                borderWidth: 0,
                borderRadius: 16,
              }}
              placeholderTextColor="#202B1866"
              contentStyle={{
                color: '#202B1866',
              }}
            />

            {/* Category Dropdown */}
            <View style={styles.dropdownContainer}>
              <Menu
                visible={categoryMenuVisible}
                onDismiss={() => setCategoryMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    style={styles.dropdownButton}
                    labelStyle={{
                      color: "#333",
                      fontSize: 14,
                      width: "100%",
                      textAlign: "left",
                    }}
                    onPress={() => setCategoryMenuVisible(true)}
                    contentStyle={{
                      flexDirection: "row-reverse",
                      width: "100%",
                    }}
                    icon={categoryMenuVisible ? "chevron-up" : "chevron-down"}
                  >
                    {menuData.category || "Select Category"}
                  </Button>
                }
                contentStyle={[styles.menuContent, { width: "100%" }]}
                style={{ alignSelf: "stretch" }}
                anchorPosition="bottom"
              >
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Menu.Item
                      key={category}
                      onPress={() => {
                        handleInputChange("category", category);
                        setCategoryMenuVisible(false);
                      }}
                      title={category}
                      titleStyle={styles.menuItem}
                    />
                  ))
                ) : (
                  <Menu.Item title="No categories available" disabled />
                )}
              </Menu>
            </View>

            <TextInput
              label="Price"
              value={menuData.price}
              onChangeText={(text) => handleInputChange("price", text)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              outlineStyle={{
                borderColor: '#91B275',
                borderWidth: 0,
                borderRadius: 16,
              }}
              placeholderTextColor="#202B1866"
              contentStyle={{
                color: '#202B1866',
              }}
            />

            <Button
              onPress={pickImage}
              mode="outlined"
              style={styles.button}
              icon={menuData.image.uri ? "image-edit" : "image-plus"}
            >
              {menuData.image.uri ? "Change Image" : "Pick an Image"}
            </Button>

            {menuData.image.uri && (
              <Image
                source={{ uri: menuData.image.uri }}
                style={[
                  styles.imagePreview,
                  {
                    width: isSmallScreen ? 100 : isMediumScreen ? 150 : 200,
                    height: isSmallScreen ? 100 : isMediumScreen ? 150 : 150,
                  },
                ]}
              />
            )}

            <View style={[styles.switchRow, { gap: isSmallScreen ? 8 : 16 }]}>
              <Text variant={isSmallScreen ? "bodyMedium" : "bodyLarge"} style={styles.switchText}>
                Is Side Item
              </Text>
              <Switch
                value={menuData.is_side}
                onValueChange={(value) => handleInputChange("is_side", value)}
                trackColor={{ false: "gray", true: "#96B76E" }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          {/* <Button onPress={onClose}>Cancel</Button> */}
          <Button
            mode="contained"
            onPress={handleUpdate}
            loading={isPending}
            style={styles.saveButton}
            contentStyle={{ height: isSmallScreen ? 40 : 50 }}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16, color: '#fff' }}
          >
            Update
          </Button>
        </Dialog.Actions>
      </Dialog>
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
    marginBottom: 10,
  },
  descInput: {
    // flex: 1,
    height: 100,
    backgroundColor: '#91B27517',
    borderWidth: 0,
    borderColor: '#91B275',
    marginBottom: 10,
  },
  button: {
    marginBottom: 10,
    borderWidth: 1,
    width: '50%',
    alignSelf: 'center',
  },
  imagePreview: {
    alignSelf: "center",
    marginBottom: 10,
    borderRadius: 8,
    resizeMode: "cover",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 8,
  },
  switchText: {
    marginRight: 8,
    fontSize: 14,
    fontWeight: '400',
    color: '#40392B',
  },
  saveButton: {
    backgroundColor: '#96B76E',
    borderRadius: 16,
    width: '100%',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    // borderWidth: 1,
    // borderColor: '#E0E0E0',
    // borderRadius: 4,
    backgroundColor: '#EBF1E6',
    borderWidth: 0,
    borderColor: '#EBF1E6',
  },
  menuContent: {
    backgroundColor: '#EBF1E6',
  },
  menuItem: {
    fontSize: 14,
    color: '#202B1866',
  },
});