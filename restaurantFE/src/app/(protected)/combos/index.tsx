import React, { useState } from "react";
import {
  ScrollView,
  View,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import {
  Button,
  Card,
  Title,
  DataTable,
  Provider as PaperProvider,
  Dialog,
  Portal,
  Text,
  Icon,
} from "react-native-paper";
import {
  useDeleteCombo,
  useGetCombos,
} from "@/services/mutation/comboMutation";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/reduxStore/store";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";

export default function Combos() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { data: combos } = useGetCombos();
  const queryClient = useQueryClient();
  const { mutateAsync: comboDelete } = useDeleteCombo();
  const [showDialog, setShowDialog] = useState(false);
  const [comboID, setComboID] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  const handleDeleteCombo = async () => {
    setComboID(null);
    setShowDialog(false);
    dispatch(showLoader());
    await comboDelete(comboID!);
    queryClient.invalidateQueries({ queryKey: ["combos"] });
    dispatch(hideLoader());
  };

  return (
    <PaperProvider>
      <ScrollView style={styles.scrollContainer}>
        <Card>
          <Card.Content>
            <View style={styles.headerContainer}>
              <Title>Combos</Title>
              <Button
                mode="contained"
                onPress={() => router.push("/(protected)/combos/addCombo")}
                style={[styles.addButton, isMobile && styles.fullWidth]}
              >
                <Icon source="plus" size={20} color="white" />
                Add Combo
              </Button>
            </View>

            <ScrollView horizontal>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Name</DataTable.Title>
                  <DataTable.Title>Branch</DataTable.Title>
                  <DataTable.Title>Price</DataTable.Title>
                  <DataTable.Title>Custom</DataTable.Title>
                  <DataTable.Title>Actions</DataTable.Title>
                </DataTable.Header>

                {combos?.map((combo) => (
                  <DataTable.Row key={combo.id}>
                    <DataTable.Cell>{combo.name}</DataTable.Cell>
                    <DataTable.Cell>
                      {typeof combo.branch === "object"
                        ? combo.branch.address
                        : combo.branch}
                    </DataTable.Cell>
                    <DataTable.Cell>${combo.combo_price}</DataTable.Cell>
                    <DataTable.Cell>
                      {combo.is_custom ? "Yes" : "No"}
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.actionCell}>
                      <Button
                        mode="text"
                        onPress={() =>
                          router.push(("/(protected)/combos/" + combo.id) as any)
                        }
                      >
                        <Icon source="pencil" size={20} color="#007AFF" />
                      </Button>
                      <Button
                        mode="text"
                        onPress={() => {
                          setShowDialog(true);
                          setComboID(combo.id);
                        }}
                      >
                        <Icon source="delete" size={20} color="#FF3B30" />
                      </Button>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>

            <Portal>
              <Dialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                style={[styles.dialog, isMobile && styles.dialogMobile]}
              >
                <Dialog.Title>Confirm Deletion</Dialog.Title>
                <Dialog.Content>
                  <Text>
                    Are you sure you want to delete this Combo? This action
                    cannot be undone.
                  </Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setShowDialog(false)}>Cancel</Button>
                  <Button onPress={handleDeleteCombo}>Delete</Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Card.Content>
        </Card>
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  addButton: {
    alignSelf: "flex-end",
    minWidth: 140,
  },
  fullWidth: {
    alignSelf: "stretch",
    marginTop: 12,
  },
  actionCell: {
    flexDirection: "row",
    gap: 4,
  },
  dialog: {
    alignSelf: "center",
    width: "50%",
  },
  dialogMobile: {
    width: "90%",
  },
});
