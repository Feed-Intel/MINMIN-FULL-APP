import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image,
  TextInput,
  Modal,
  Platform,
  Alert,
} from "react-native";
import {
  Button,
  Text,
  Card,
  Dialog,
  Portal,
  Icon,
  Switch,
  Menu,
} from "react-native-paper";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

import {
  useCreateTable,
  useDeleteTable,
  useGetTables,
  useUpdateTable,
} from "@/services/mutation/tableMutation";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";
import Pencil from "@/assets/icons/Pencil.svg";
import Delete from "@/assets/icons/Delete.svg";
import Download from "@/assets/icons/Download.svg";
import { Branch } from "@/types/branchType";
import { useGetBranches } from "@/services/mutation/branchMutation";
import Toast from "react-native-toast-message";

interface TableStates {
  [key: string]: {
    isFast: boolean;
    isDelivery: boolean;
    isInside: boolean;
    isActive: boolean;
  };
}

// Dropdown component
const YesNoDropdown = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (val: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button
          mode="outlined"
          onPress={() => setVisible(true)}
          style={styles.dropdownBtn}
          labelStyle={{ color: "#333", fontSize: 14 }}
          contentStyle={{ flexDirection: "row-reverse" }} // moves arrow to the right
          icon={() => (
            <Icon
              source={visible ? "chevron-up" : "chevron-down"} // toggle up/down
              size={18}
              color="#333"
            />
          )}
        >
          {value ? "yes" : "no"}
        </Button>
      }
    >
      <Menu.Item
        onPress={() => {
          onChange(true);
          setVisible(false);
        }}
        title="yes"
      />
      <Menu.Item
        onPress={() => {
          onChange(false);
          setVisible(false);
        }}
        title="no"
      />
    </Menu>
  );
};

const ManageTables: React.FC = () => {
  const { width }: { width: number } = useWindowDimensions();
  const { data: tables = [] } = useGetTables();
  const { mutateAsync: tableDelete } = useDeleteTable();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const [showDialog, setShowDialog] = React.useState<boolean>(false);
  const [tableID, setTableID] = React.useState<string | null>(null);
  const [addTableModalVisible, setAddTableModalVisible] = useState(false);
  const { data: branches = [] } = useGetBranches();
  const [tableStates, setTableStates] = useState<TableStates>(
    tables.reduce((acc: TableStates, table: any) => {
      acc[table.id] = {
        isFast: table.is_fast_table,
        isDelivery: table.is_delivery_table,
        isInside: table.is_inside_table,
        isActive: true,
      };
      return acc;
    }, {} as TableStates)
  );
  const [table, setTable] = useState<{} | null>(null);
  const isSmallScreen: boolean = width < 768;

  const handleDeleteTable = async (): Promise<void> => {
    setTableID(null);
    setShowDialog(false);
    dispatch(showLoader());
    try {
      if (tableID) {
        await tableDelete(tableID);
        queryClient.invalidateQueries({ queryKey: ["tables"] });
      }
    } catch (error) {
      console.error("Error deleting table:", error);
    } finally {
      dispatch(hideLoader());
    }
  };

  const handleToggleSwitch = (
    tableId: string,
    key: keyof TableStates[string],
    value?: boolean
  ): void => {
    setTableStates((prevStates: TableStates) => ({
      ...prevStates,
      [tableId]: {
        ...prevStates[tableId],
        [key]: value !== undefined ? value : !prevStates[tableId][key],
      },
    }));
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
    <View style={rootStyles.container}>
      <ScrollView style={styles.container}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="titleLarge" style={styles.title}>
                Table
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <TextInput
                placeholder="search by Item location or table number"
                style={styles.searchBar}
                placeholderTextColor="#999"
              />
              <Button
                mode="contained"
                onPress={() => setAddTableModalVisible(true)}
                style={styles.addButton}
                labelStyle={{ fontSize: 14, color: "#fff" }}
              >
                + Add table
              </Button>
            </View>

            {/* Table */}
            <ScrollView horizontal={isSmallScreen}>
              <View style={styles.dataTable}>
                <View style={styles.dataTableHeader}>
                  {[
                    "Branch",
                    "Table ID",
                    "Fast",
                    "Delivery",
                    "Inside",
                    "QR",
                    "Actions",
                  ].map((title, index) => (
                    <Text
                      key={index}
                      style={[
                        styles.headerCell,
                        {
                          flex: COLUMN_WIDTHS[index],
                          textAlign: index === 0 ? "left" : "center",
                          position: "relative",
                          left: index === 0 ? 20 : 0,
                        },
                      ]}
                    >
                      {title}
                    </Text>
                  ))}
                </View>

                {tables.map((table: any) => (
                  <View key={table.id} style={styles.row}>
                    {/* Branch */}
                    <Text
                      style={[
                        styles.cell,
                        {
                          flex: COLUMN_WIDTHS[0],
                          textAlign: "left",
                          paddingLeft: 10,
                          position: "relative",
                          left: 20,
                        },
                      ]}
                    >
                      {typeof table.branch === "string"
                        ? table.branch
                        : table.branch?.address}
                    </Text>

                    <Text style={[styles.cell, { flex: COLUMN_WIDTHS[1] }]}>
                      {table.table_code || "N/A"}
                    </Text>

                    <Text style={[styles.cell, { flex: COLUMN_WIDTHS[2] }]}>
                      <YesNoDropdown
                        value={tableStates[table.id]?.isFast}
                        onChange={(val: boolean) =>
                          handleToggleSwitch(table.id, "isFast", val)
                        }
                      />
                    </Text>

                    {/* Delivery table */}
                    <Text style={[styles.cell, { flex: COLUMN_WIDTHS[3] }]}>
                      <YesNoDropdown
                        value={tableStates[table.id]?.isDelivery}
                        onChange={(val: boolean) =>
                          handleToggleSwitch(table.id, "isDelivery", val)
                        }
                      />
                    </Text>

                    {/* Inside table */}
                    <Text style={[styles.cell, { flex: COLUMN_WIDTHS[4] }]}>
                      <YesNoDropdown
                        value={tableStates[table.id]?.isInside}
                        onChange={(val: boolean) =>
                          handleToggleSwitch(table.id, "isInside", val)
                        }
                      />
                    </Text>

                    {/* QR Code */}
                    <Text style={[styles.cell, { flex: COLUMN_WIDTHS[5] }]}>
                      <Image
                        source={{
                          uri: table.qr_code
                            ? process.env.EXPO_PUBLIC_IMAGE_PATH +
                              table.qr_code.qr_code_url
                            : "https://placehold.co/50x50/e0e0e0/000000?text=QR",
                        }}
                        style={styles.qrCodeImage}
                      />
                    </Text>

                    {/* Actions */}
                    <Text style={[styles.cell, { flex: COLUMN_WIDTHS[6] }]}>
                      <View style={styles.actionContainer}>
                        <Switch
                          value={tableStates[table.id]?.isActive}
                          onValueChange={(val) =>
                            handleToggleSwitch(table.id, "isActive", val)
                          }
                          color="#91B275"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setTable({
                              id: table.id,
                              branch: (table.branch as Branch).id!,
                              is_fast_table: table.is_fast_table,
                              is_delivery_table: table.is_delivery_table,
                              is_inside_table: table.is_inside_table,
                            })
                          }
                        >
                          <Pencil height={40} width={40} color="#91B275" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setTableID(table.id);
                            setShowDialog(true);
                          }}
                        >
                          <Delete height={40} width={40} color="#91B275" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            downloadQRCode(
                              process.env.EXPO_PUBLIC_IMAGE_PATH +
                                table.qr_code.qr_code_url
                            )
                          }
                        >
                          <Download height={40} width={40} color="#91B275" />
                        </TouchableOpacity>
                      </View>
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Delete Dialog */}
            <Portal>
              <Dialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                style={[styles.dialog, { width: "50%", alignSelf: "center" }]}
              >
                <Dialog.Title style={{ color: "#000" }}>
                  Confirm Deletion
                </Dialog.Title>
                <Dialog.Content>
                  <Text style={{ color: "#000" }}>
                    Are you sure you want to delete this table?
                  </Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button
                    onPress={() => setShowDialog(false)}
                    labelStyle={{ color: "#000" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleDeleteTable}
                    labelStyle={{ color: "#ff0000" }}
                  >
                    Delete
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Card.Content>
        </Card>
      </ScrollView>
      <AddTableModal
        branches={branches as Branch[]}
        visible={addTableModalVisible}
        onClose={() => setAddTableModalVisible(false)}
      />
      {table && (
        <EditTableModal
          branches={branches as Branch[]}
          table={table as any}
          visible={Boolean(table)}
          onClose={() => setTable(null)}
        />
      )}
    </View>
  );
};

const COLUMN_WIDTHS = [1, 1, 1, 1, 1, 1, 1.5];

const rootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF4EB",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#EFF4EB",
    borderColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 30,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#91B27517",
    flex: 1,
  },
  dataTable: {
    minWidth: 700,
  },
  dataTableHeader: {
    flexDirection: "row",
    backgroundColor: "#EFF4EB",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#4A4A4A",
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    minHeight: 55,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    color: "#40392B",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dropdownBtn: {
    backgroundColor: "#91B27517",
    borderRadius: 6,
    minWidth: 60,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#6483490F",
  },
  qrCodeImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignSelf: "center",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 130,
    alignSelf: "center",
  },
  dialog: {
    borderRadius: 12,
    backgroundColor: "#fff",
  },
});

export default ManageTables;

type AddTableModalProps = {
  branches: Branch[];
  visible: boolean;
  onClose: () => void;
};

function AddTableModal({ branches, visible, onClose }: AddTableModalProps) {
  const [branch, setBranch] = useState<string>("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFastTable, setIsFastTable] = useState(false);
  const [isDeliveryTable, setIsDeliveryTable] = useState(false);
  const [isInsideTable, setIsInsideTable] = useState(false);

  const { mutateAsync: onAdd } = useCreateTable();
  const queryClient = useQueryClient();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Content>
          <ScrollView>
            {/* Branch Dropdown */}
            <View style={stylesModal.container}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    style={stylesModal.dropdownBtn}
                    labelStyle={{
                      color: "#333",
                      fontSize: 14,
                      width: "100%",
                      textAlign: "left",
                    }}
                    onPress={() => setMenuVisible(true)}
                    contentStyle={{
                      flexDirection: "row-reverse",
                      width: "100%",
                    }}
                    icon={menuVisible ? "chevron-up" : "chevron-down"}
                  >
                    {branch
                      ? branches.find((b: any) => b.id === branch)?.address
                      : "Branch"}
                  </Button>
                }
                contentStyle={[stylesModal.menuContainer, { width: "100%" }]} // custom menu style
                style={{ alignSelf: "stretch" }} // Make it align with the anchor width
                anchorPosition="bottom"
              >
                {branches.length > 0 ? (
                  branches.map((b: any) => (
                    <Menu.Item
                      key={b.id}
                      onPress={() => {
                        setBranch(b.id);
                        setMenuVisible(false);
                      }}
                      title={b.address}
                      titleStyle={stylesModal.menuItem}
                    />
                  ))
                ) : (
                  <Menu.Item title="No branches available" disabled />
                )}
              </Menu>
            </View>

            {/* Toggles */}
            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Fast Table</Text>
              <Switch
                value={isFastTable}
                onValueChange={setIsFastTable}
                color="#91B275"
              />
            </View>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Delivery Table</Text>
              <Switch
                value={isDeliveryTable}
                onValueChange={setIsDeliveryTable}
                color="#91B275"
              />
            </View>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Inside Table</Text>
              <Switch
                value={isInsideTable}
                onValueChange={setIsInsideTable}
                color="#91B275"
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            style={styles.addButton}
            labelStyle={{ color: "#fff" }}
            onPress={async () => {
              if (branch) {
                await onAdd({
                  branch,
                  is_fast_table: isFastTable,
                  is_delivery_table: isDeliveryTable,
                  is_inside_table: isInsideTable,
                });
                queryClient.invalidateQueries({ queryKey: ["tables"] });
                queryClient.invalidateQueries({ queryKey: ["qrCode"] });
                onClose();
              } else {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: "Branch is required.",
                });
              }
            }}
          >
            + Add Table
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

interface EditTableModalProps {
  branches: Branch[];
  table: {
    id: string;
    branch: string;
    is_fast_table: boolean;
    is_delivery_table: boolean;
    is_inside_table: boolean;
  };
  visible: boolean;
  onClose: () => void;
}

function EditTableModal({
  branches,
  table,
  visible,
  onClose,
}: EditTableModalProps) {
  const [branch, setBranch] = useState<string>(table.branch);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isFastTable, setIsFastTable] = useState(table.is_fast_table);
  const [isDeliveryTable, setIsDeliveryTable] = useState(
    table.is_delivery_table
  );
  const [isInsideTable, setIsInsideTable] = useState(table.is_inside_table);

  const { mutateAsync: onUpdate } = useUpdateTable();
  const queryClient = useQueryClient();

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Content>
          <ScrollView>
            <View style={stylesModal.container}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    style={stylesModal.dropdownBtn}
                    labelStyle={{
                      color: "#333",
                      fontSize: 14,
                      width: "100%",
                      textAlign: "left",
                    }}
                    onPress={() => setMenuVisible(true)}
                    contentStyle={{
                      flexDirection: "row-reverse",
                      width: "100%",
                    }}
                    icon={menuVisible ? "chevron-up" : "chevron-down"}
                  >
                    {branch
                      ? branches.find((b: any) => b.id === branch)?.address
                      : "Branch"}
                  </Button>
                }
                contentStyle={[stylesModal.menuContainer, { width: "100%" }]} // custom menu style
                style={{ alignSelf: "stretch" }} // Make it align with the anchor width
                anchorPosition="bottom"
              >
                {branches.length > 0 ? (
                  branches.map((b: any) => (
                    <Menu.Item
                      key={b.id}
                      onPress={() => {
                        setBranch(b.id);
                        setMenuVisible(false);
                      }}
                      title={b.address}
                      titleStyle={stylesModal.menuItem}
                    />
                  ))
                ) : (
                  <Menu.Item title="No branches available" disabled />
                )}
              </Menu>
            </View>

            {/* Toggles */}
            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Fast Table</Text>
              <Switch
                value={isFastTable}
                onValueChange={setIsFastTable}
                color="#91B275"
              />
            </View>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Delivery Table</Text>
              <Switch
                value={isDeliveryTable}
                onValueChange={setIsDeliveryTable}
                color="#91B275"
              />
            </View>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Inside Table</Text>
              <Switch
                value={isInsideTable}
                onValueChange={setIsInsideTable}
                color="#91B275"
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            style={styles.addButton}
            labelStyle={{ color: "#fff" }}
            onPress={async () => {
              await onUpdate({
                id: table.id,
                branch,
                is_fast_table: isFastTable,
                is_delivery_table: isDeliveryTable,
                is_inside_table: isInsideTable,
              });
              queryClient.invalidateQueries({ queryKey: ["tables"] });
              queryClient.invalidateQueries({ queryKey: ["qrCode"] });
              onClose();
            }}
          >
            Edit Table
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: "#EFF4EB",
    width: "40%",
    alignSelf: "center",
    borderRadius: 12,
  },
  menuItem: {
    color: "#333",
    fontSize: 14,
  },
  container: {
    marginBottom: 24,
  },
  dropdownBtn: {
    backgroundColor: "#f5f9f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "space-between",
    width: "100%",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 5,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 30,
  },
});
