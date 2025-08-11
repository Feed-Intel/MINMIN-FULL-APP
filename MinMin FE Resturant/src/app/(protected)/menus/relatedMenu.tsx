import React from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Text,
  DataTable,
  Button,
  ActivityIndicator,
  Card,
  Portal,
  Dialog,
  Icon,
} from "react-native-paper";
import { router } from "expo-router";
import {
  useDeleteRelatedMenu,
  useGetRelatedMenus,
} from "@/services/mutation/menuMutation";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/reduxStore/store";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";

export default function RelatedItemManagement() {
  const { width } = useWindowDimensions();
  const { data: relatedItems, isLoading: loadingRelatedItems } =
    useGetRelatedMenus();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = React.useState(false);
  const [relatedMenuID, setRelatedMenuID] = React.useState<string | null>(null);
  const { mutateAsync: deleteRelatedMenu, isPending: isDeleting } =
    useDeleteRelatedMenu();
  const dispatch = useDispatch<AppDispatch>();

  // Screen size breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  // Column width calculations
  const columnWidths = {
    menuItem: isSmallScreen ? width * 0.4 : 200,
    relatedItem: isSmallScreen ? width * 0.4 : 200,
    tag: isSmallScreen ? width * 0.3 : 150,
    actions: 120,
  };

  const handleDeleteRelatedMenu = async () => {
    setRelatedMenuID(null);
    setShowDialog(false);
    dispatch(showLoader());
    await deleteRelatedMenu(relatedMenuID!);
    queryClient.invalidateQueries({ queryKey: ["relatedMenus"] });
    dispatch(hideLoader());
  };

  if (loadingRelatedItems) {
    return (
      <ActivityIndicator
        animating={true}
        style={styles.loading}
        size={isSmallScreen ? "small" : "large"}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card>
        <Card.Content>
          <Text
            variant={isSmallScreen ? "headlineMedium" : "headlineLarge"}
            style={[styles.title, { marginBottom: isSmallScreen ? 12 : 16 }]}
          >
            Related Items
          </Text>

          <Button
            mode="contained"
            onPress={() => router.push("/(protected)/menus/addRelatedItem")}
            style={[
              styles.addButton,
              {
                width: isSmallScreen ? "100%" : "auto",
                alignSelf: isSmallScreen ? "center" : "flex-end",
                marginBottom: isSmallScreen ? 12 : 16,
              },
            ]}
            contentStyle={{ flexDirection: "row-reverse" }}
            labelStyle={{ fontSize: isSmallScreen ? 14 : 16 }}
          >
            <Icon source="plus" size={20} color="gray" />
            Add Related Item
          </Button>

          <ScrollView horizontal={isSmallScreen}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title
                  style={[styles.tableHeader, { width: columnWidths.menuItem }]}
                >
                  Menu Item
                </DataTable.Title>
                <DataTable.Title
                  style={[
                    styles.tableHeader,
                    { width: columnWidths.relatedItem },
                  ]}
                >
                  Related Item
                </DataTable.Title>
                <DataTable.Title
                  style={[styles.tableHeader, { width: columnWidths.tag }]}
                >
                  Tag
                </DataTable.Title>
                <DataTable.Title
                  style={[styles.tableHeader, { width: columnWidths.actions }]}
                >
                  Actions
                </DataTable.Title>
              </DataTable.Header>

              {relatedItems?.map((item) => (
                <DataTable.Row key={item.id} style={styles.tableRow}>
                  <DataTable.Cell
                    style={[styles.tableCell, { width: columnWidths.menuItem }]}
                  >
                    <Text numberOfLines={2}>
                      {typeof item.menu_item === "string"
                        ? item.menu_item
                        : item.menu_item?.name}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell
                    style={[
                      styles.tableCell,
                      { width: columnWidths.relatedItem },
                    ]}
                  >
                    <Text numberOfLines={2}>
                      {typeof item.related_item === "string"
                        ? item.related_item
                        : item.related_item?.name}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell
                    style={[styles.tableCell, { width: columnWidths.tag }]}
                  >
                    <Text numberOfLines={1}>{item.tag}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell
                    style={[styles.actionCell, { width: columnWidths.actions }]}
                  >
                    <View style={styles.actionContainer}>
                      <Button
                        compact
                        onPress={() =>
                          router.push(`/(protected)/menus/edit/${item.id}`)
                        }
                        style={styles.actionButton}
                      >
                        <Icon
                          source="pencil"
                          size={isSmallScreen ? 18 : 20}
                          color="#007AFF"
                        />
                      </Button>
                      <Button
                        compact
                        mode="text"
                        onPress={() => {
                          setRelatedMenuID(item.id!);
                          setShowDialog(true);
                        }}
                        disabled={isDeleting}
                        style={styles.actionButton}
                      >
                        <Icon
                          source="delete"
                          size={isSmallScreen ? 18 : 20}
                          color="#FF3B30"
                        />
                      </Button>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>

          <Portal>
            <Dialog
              visible={showDialog}
              onDismiss={() => setShowDialog(false)}
              style={[
                styles.dialog,
                {
                  width: isSmallScreen ? "90%" : "50%",
                  marginHorizontal: "auto",
                },
              ]}
            >
              <Dialog.Title>Confirm Deletion</Dialog.Title>
              <Dialog.Content>
                <Text variant="bodyMedium">
                  Are you sure you want to delete this Related Menu? This action
                  cannot be undone.
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setShowDialog(false)}>Cancel</Button>
                <Button onPress={handleDeleteRelatedMenu}>Delete</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: "center",
    fontWeight: "600",
  },
  addButton: {
    borderRadius: 8,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tableHeader: {
    justifyContent: "center",
    height: 50,
    paddingHorizontal: 8,
  },
  tableRow: {
    minHeight: 60,
  },
  tableCell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  actionCell: {
    justifyContent: "center",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  actionButton: {
    marginHorizontal: 4,
  },
  dialog: {
    borderRadius: 8,
  },
});
