import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  Platform,
  useWindowDimensions,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import {
  Button,
  DataTable,
  Appbar,
  Card,
  Portal,
  Dialog,
  Text,
  Icon,
} from "react-native-paper";
import {
  useDeleteQRCode,
  useGetQRCodes,
} from "@/services/mutation/qrCodeMutation";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";
import BranchSelector from "@/components/BranchSelector";
import { useRestaurantIdentity } from "@/hooks/useRestaurantIdentity";
import ModalHeader from "@/components/ModalHeader";

export default function QRCodes() {
  const { data: qrCodes } = useGetQRCodes();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;
  const isMediumScreen = width >= 600 && width < 1024;
  const dispatch = useDispatch();
  const { mutateAsync: qrCodeDelete } = useDeleteQRCode();
  const [showDialog, setShowDialog] = React.useState(false);
  const [qrCodeID, setQrCodeID] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    isBranch ? branchId ?? null : null
  );

  const filteredQRCodes = useMemo(() => {
    if (!qrCodes) return [] as typeof qrCodes;
    if (!selectedBranch || selectedBranch === "all") return qrCodes;

    return qrCodes.filter((qr) => {
      const branchValue =
        typeof qr.branch === "object" ? qr.branch?.id : qr.branch;
      return branchValue === selectedBranch;
    });
  }, [qrCodes, selectedBranch]);
  const handleDeleteQRCode = async () => {
    setQrCodeID(null);
    setShowDialog(false);
    dispatch(showLoader());
    await qrCodeDelete(qrCodeID!);
    queryClient.invalidateQueries({ queryKey: ["qrCodes"] });
    dispatch(hideLoader());
  };

  const downloadQRCode = async (imageUrl: string) => {
    if (Platform.OS === "web") {
      // Fetch the image as a Blob
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Create a hidden download link
        const link = document.createElement("a");
        link.href = url;
        link.download = "table_qr_code.png"; // Set file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Release the object URL
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Download failed:", error);
        alert("Failed to download QR Code.");
      }
    } else {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Storage permission is required.");
          return;
        }

        const fileUri = `${FileSystem.documentDirectory}qr_code.png`;
        const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Success", "QR Code saved to gallery!");
      } catch (error) {
        Alert.alert("Error", "Failed to download QR Code.");
      }
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.Content title="QR Codes" />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { padding: isSmallScreen ? 8 : 16 }]}
      >
        <Card style={styles.sectionCard}>
          <Card.Content
            style={[
              styles.sectionHeader,
              isSmallScreen && {
                flexDirection: "column",
                alignItems: "flex-start",
              },
            ]}
          >
            <Text variant={isSmallScreen ? "titleMedium" : "headlineSmall"}>
              Manage QR Codes
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push("/(protected)/qrcodes/addQRcode")}
              style={{
                alignSelf: isSmallScreen ? "stretch" : "flex-end",
                width: isSmallScreen ? "100%" : isMediumScreen ? "35%" : "25%",
                marginTop: isSmallScreen ? 8 : 0,
              }}
            >
              <Icon source="plus" size={20} color="gray" />
              {isSmallScreen ? "Create" : "Create QRcode"}
            </Button>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <BranchSelector
              selectedBranch={selectedBranch}
              onChange={setSelectedBranch}
              includeAllOption={isRestaurant}
              style={{ marginBottom: 16 }}
            />
            <ScrollView horizontal={isSmallScreen}>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ width: isSmallScreen ? 120 : 160 }}>
                    Branch
                  </DataTable.Title>
                  <DataTable.Title style={{ width: isSmallScreen ? 100 : 120 }}>
                    Table
                  </DataTable.Title>
                  <DataTable.Title style={{ width: isSmallScreen ? 80 : 100 }}>
                    QR Code
                  </DataTable.Title>
                  <DataTable.Title style={{ width: isSmallScreen ? 150 : 200 }}>
                    Actions
                  </DataTable.Title>
                </DataTable.Header>

                {filteredQRCodes.map((qr) => (
                  <DataTable.Row key={qr.id}>
                    <DataTable.Cell
                      style={{ width: isSmallScreen ? 120 : 160 }}
                    >
                      {qr.branch?.address || "N/A"}
                    </DataTable.Cell>
                    <DataTable.Cell
                      style={{ width: isSmallScreen ? 100 : 120 }}
                    >
                      {qr.table?.table_code || "Branch QR"}
                    </DataTable.Cell>
                    <DataTable.Cell style={{ width: isSmallScreen ? 80 : 100 }}>
                      <Image
                        source={{
                          uri:
                            process.env.EXPO_PUBLIC_IMAGE_PATH + qr.qr_code_url,
                        }}
                        style={{
                          width: isSmallScreen ? 40 : isMediumScreen ? 50 : 60,
                          height: isSmallScreen ? 40 : isMediumScreen ? 50 : 60,
                        }}
                      />
                    </DataTable.Cell>
                    <DataTable.Cell
                      style={{ width: isSmallScreen ? 150 : 200 }}
                    >
                      <View
                        style={{
                          flexDirection: isSmallScreen ? "column" : "row",
                          gap: 4,
                          alignItems: "flex-start",
                        }}
                      >
                        <Button
                          icon="download"
                          compact={isSmallScreen}
                          onPress={() =>
                            downloadQRCode(
                              process.env.EXPO_PUBLIC_IMAGE_PATH +
                                qr.qr_code_url
                            )
                          }
                        >
                          {isSmallScreen ? "" : "Download"}
                        </Button>
                        <Button
                          icon="delete"
                          compact={isSmallScreen}
                          onPress={() => {
                            setQrCodeID(qr.id);
                            setShowDialog(true);
                          }}
                        >
                          {isSmallScreen ? "" : "Delete"}
                        </Button>
                      </View>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>

            {/* Delete Confirmation Dialog */}
            <Portal>
              <Dialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                style={{
                  width: isSmallScreen ? "90%" : "50%",
                  marginHorizontal: "auto",
                  alignSelf: "center",
                }}
              >
                <Dialog.Title>
                  <ModalHeader
                    title="Confirm Deletion"
                    onClose={() => setShowDialog(false)}
                  />
                </Dialog.Title>
                <Dialog.Content>
                  <Text>
                    Are you sure you want to delete this QR code? This action
                    cannot be undone.
                  </Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowDialog(false)}>Cancel</Button>
                  <Button onPress={handleDeleteQRCode}>Delete</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
