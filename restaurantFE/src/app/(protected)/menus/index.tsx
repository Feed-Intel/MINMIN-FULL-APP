import React, { useState, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Image,
  View,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Button,
  DataTable,
  Card,
  Portal,
  Dialog,
  Paragraph,
  Icon,
  Searchbar,
  Checkbox,
  Chip,
  Modal,
  TextInput,
  Divider,
  Switch,
  ActivityIndicator,
  Snackbar,
} from "react-native-paper";
import { router } from "expo-router";
import {
  useDeleteMenu,
  useGetMenus,
  useUpdateMenuAvailability,
  useGetMenuAvailabilities,
} from "@/services/mutation/menuMutation";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/reduxStore/store";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";
import { useGetCombos } from "@/services/mutation/comboMutation";
import { useGetBranches } from "@/services/mutation/branchMutation";
import BranchSelector from "@/components/BranchSelector";
import { useRestaurantIdentity } from "@/hooks/useRestaurantIdentity";
import AddMenuModal from "./addMenu";
import AddComboModal from "../combos/addCombo";
import EditMenuDialog from "./[menuId]";
import EditComboDialog from "../combos/[comboId]";

const DEFAULT_CATEGORIES = ["Main course", "Pasta", "Dessert", "Drinks"];
const TAGS = ["Best Paired With", "Alternative", "Customer Favorite"];

export default function Menus() {
  const { width } = useWindowDimensions();
  const { data: menus, isLoading: isMenusLoading } = useGetMenus();
  const { data: combos, isLoading: isCombosLoading } = useGetCombos();
  const { data: branches } = useGetBranches();
  const { mutateAsync: menuDelete } = useDeleteMenu();
  const { mutateAsync: updateAvailability } = useUpdateMenuAvailability();
  const { data: availabilityData } = useGetMenuAvailabilities();
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();

  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = React.useState(false);
  const [menuID, setMenuID] = React.useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<"all" | "combos">("all");
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    isBranch ? branchId ?? null : null
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Modal states
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showAddComboModal, setShowAddComboModal] = useState(false);

  // Related items modal state
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [tag, setTag] = useState("");

  // Separate state for main table and modal
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  const [mainSelectedCategory, setMainSelectedCategory] = useState("All");
  const [combosSearchQuery, setCombosSearchQuery] = useState("");
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [modalSelectedCategory, setModalSelectedCategory] = useState("All");

  // Edit dialog states
  const [showEditMenuDialog, setShowEditMenuDialog] = useState(false);
  const [showEditComboDialog, setShowEditComboDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const getMenuCategories = (menu: any): string[] => {
    if (Array.isArray(menu?.categories) && menu.categories.length) {
      return menu.categories;
    }
    if (Array.isArray(menu?.category) && menu.category.length) {
      return menu.category.filter((value: any) => typeof value === 'string');
    }
    if (typeof menu?.category === 'string' && menu.category) {
      return [menu.category];
    }
    return [];
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    menus?.forEach((menuItem) => {
      getMenuCategories(menuItem).forEach((category) => {
        if (category) {
          set.add(category);
        }
      });
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [menus]);

  const handleDeleteMenu = async () => {
    setMenuID(null);
    setShowDialog(false);
    dispatch(showLoader());
    await menuDelete(menuID!);
    queryClient.invalidateQueries({ queryKey: ["menus"] });
    dispatch(hideLoader());
  };

  const openRelatedModal = (menu: any) => {
    setCurrentMenuItem(menu);
    setModalSearchQuery("");
    setModalSelectedCategory("All");
    setSelectedItems([]);
    setTag("");
    setShowRelatedModal(true);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAddRelatedItems = () => {
    setShowRelatedModal(false);
    router.push({
      pathname: "/(protected)/menus/addRelatedItem",
      params: {
        menuItem: currentMenuItem.id,
        relatedItems: JSON.stringify(selectedItems),
        tag,
      },
    });
  };

  const branchFilteredMenus = useMemo(() => {
    if (!menus) return [] as typeof menus;
    if (!selectedBranch || selectedBranch === "all") return menus;

    if (!availabilityData?.results) return menus;

    return menus.filter((menu) =>
      availabilityData.results.some((avail) => {
        const branchValue =
          typeof avail.branch === "object" ? avail.branch?.id : avail.branch;
        const menuValue =
          typeof avail.menu_item === "object"
            ? avail.menu_item?.id
            : avail.menu_item;

        return branchValue === selectedBranch && menuValue === menu.id;
      })
    );
  }, [menus, selectedBranch, availabilityData]);

  // Filter menus for main table
  const filteredMenus = branchFilteredMenus?.filter((menu) => {
    const categories = getMenuCategories(menu);
    const matchesCategory =
      mainSelectedCategory === "All" || categories.includes(mainSelectedCategory);
    const categoryText = categories.join(" ");

    return (
      matchesCategory &&
      (menu.name.toLowerCase().includes(mainSearchQuery.toLowerCase()) ||
        categoryText.toLowerCase().includes(mainSearchQuery.toLowerCase()))
    );
  });

  const branchFilteredCombos = useMemo(() => {
    if (!combos) return [] as typeof combos;
    if (!selectedBranch || selectedBranch === "all") return combos;

    return combos.filter((combo) => {
      const branchValue =
        typeof combo.branch === "object" ? combo.branch?.id : combo.branch;
      return branchValue === selectedBranch;
    });
  }, [combos, selectedBranch]);

  // Filter combos for combos tab
  const filteredCombos = branchFilteredCombos?.filter(
    (combo) =>
      combo.name.toLowerCase().includes(combosSearchQuery.toLowerCase()) ||
      (typeof combo.branch === "object"
        ? combo.branch?.address
            ?.toLowerCase()
            .includes(combosSearchQuery.toLowerCase())
        : combo.branch?.toLowerCase().includes(combosSearchQuery.toLowerCase()))
  );

  // Filter menus for modal
  const modalFilteredMenus = branchFilteredMenus?.filter((menu) => {
    if (menu.id === currentMenuItem?.id) {
      return false;
    }
    const categories = getMenuCategories(menu);
    const matchesCategory =
      modalSelectedCategory === "All" || categories.includes(modalSelectedCategory);
    const categoryText = categories.join(" ");

    return (
      matchesCategory &&
      (menu.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        categoryText.toLowerCase().includes(modalSearchQuery.toLowerCase()))
    );
  });

  // Get availability status for a menu item
  const getAvailabilityStatus = (menuId: string) => {
    if (!selectedBranch || selectedBranch === "all") return false;

    const availability = availabilityData?.results.find(
      (avail) =>
        (typeof avail.branch === "object" ? avail.branch.id : avail.branch) ===
          selectedBranch &&
        (typeof avail.menu_item === "object"
          ? avail.menu_item.id
          : avail.menu_item) === menuId
    );

    return availability ? availability.is_available : false;
  };

  // Toggle menu availability
  const toggleAvailability = async (menuId: string, isAvailable: boolean) => {
    if (!selectedBranch || selectedBranch === "all") return;

    try {
      await updateAvailability({
        branch: selectedBranch,
        menu_item: menuId,
        is_available: isAvailable,
      });

      setSnackbarMessage(
        isAvailable
          ? "Menu item is now available"
          : "Menu item is now unavailable"
      );
      setSnackbarVisible(true);

      queryClient.invalidateQueries({ queryKey: ["menuAvailabilities"] });
    } catch (error) {
      setSnackbarMessage("Failed to update availability");
      setSnackbarVisible(true);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          Menus
        </Text>
        <BranchSelector
          selectedBranch={selectedBranch}
          onChange={setSelectedBranch}
          includeAllOption={isRestaurant}
          style={styles.branchSelector}
        />
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={
              activeTab === "all"
                ? "Search by Item name or Category"
                : "Search by Combo name or Branch"
            }
            value={activeTab === "all" ? mainSearchQuery : combosSearchQuery}
            onChangeText={(text) =>
              activeTab === "all"
                ? setMainSearchQuery(text)
                : setCombosSearchQuery(text)
            }
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            placeholderTextColor="#8D8D8D"
          />
          <Button
            mode="contained"
            onPress={() =>
              activeTab === "all"
                ? setShowAddMenuModal(true)
                : setShowAddComboModal(true)
            }
            style={styles.addButton}
            labelStyle={styles.addButtonLabel}
          >
            + Add {activeTab === "all" ? "Item" : "Combo"}
          </Button>
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContainer}
      >
        {categoryOptions.map((category) => (
          <Chip
            key={category}
            mode="outlined"
            selected={mainSelectedCategory === category}
            onPress={() => setMainSelectedCategory(category)}
            style={[
              styles.categoryChip,
              mainSelectedCategory === category && styles.selectedCategoryChip,
            ]}
            textStyle={[
              styles.categoryChipText,
              mainSelectedCategory === category &&
                styles.selectedCategoryChipText,
            ]}
          >
            {category}
          </Chip>
        ))}
      </ScrollView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "all" && styles.activeTabLabel,
              ]}
            >
              All items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "combos" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("combos")}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === "combos" && styles.activeTabLabel,
              ]}
            >
              Combos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Indicator */}
      {isMenusLoading && (
        <ActivityIndicator
          animating={true}
          size="large"
          color="#91B275"
          style={styles.loader}
        />
      )}

      {/* Menu Items Table */}
      {activeTab === "all" && !isMenusLoading && (
        <View style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.imageHeader}>
                {" "}
                <Text style={styles.tableTitle}>Image</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Name</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Category</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Price</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Related items</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Actions</Text>
              </DataTable.Title>
            </DataTable.Header>

            {filteredMenus?.map((menu) => {
              const categories = getMenuCategories(menu);
              const categoriesLabel = categories.length
                ? categories.join(", ")
                : "—";

              return (
              <DataTable.Row key={menu.id} style={styles.tableRow}>
                <DataTable.Cell style={styles.imageCell}>
                  <Image
                    source={{ uri: menu.image }}
                    style={styles.menuImage}
                  />
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.menuName}>{menu.name}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.categoryTag}>{categoriesLabel}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.menuPrice}>${menu.price}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Button
                    mode="outlined"
                    onPress={() => openRelatedModal(menu)}
                    style={styles.relatedButton}
                    labelStyle={styles.relatedButtonLabel}
                  >
                    + Related item
                  </Button>
                </DataTable.Cell>
                <DataTable.Cell>
                  <View style={styles.actionsContainer}>
                    <View style={styles.toggleContainer}>
                      <Switch
                        value={getAvailabilityStatus(menu.id!)}
                        onValueChange={(value) =>
                          toggleAvailability(menu.id!, value)
                        }
                        color="#91B275"
                        disabled={!selectedBranch || selectedBranch === "all"}
                      />
                    </View>
                    <Button
                      mode="text"
                      onPress={() => {
                        setSelectedItem(menu);
                        setShowEditMenuDialog(true);
                      }}
                      icon="pencil-outline"
                      contentStyle={styles.deleteButtonContent}
                      labelStyle={styles.deleteButtonLabel}
                      style={styles.actionButton}
                    />
                    <Button
                      mode="text"
                      onPress={() => {
                        setMenuID(menu.id!);
                        setShowDialog(true);
                      }}
                      contentStyle={styles.deleteButtonContent}
                      labelStyle={styles.deleteButtonLabel}
                      icon="delete-outline"
                      style={styles.actionButton}
                    />
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            );
            })}
          </DataTable>
        </View>
      )}

      {/* Combos Table */}
      {activeTab === "combos" && !isCombosLoading && (
        <View style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Name</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Branch</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Price</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Custom</Text>
              </DataTable.Title>
              <DataTable.Title>
                {" "}
                <Text style={styles.tableTitle}>Actions</Text>
              </DataTable.Title>
            </DataTable.Header>

            {filteredCombos?.map((combo) => (
              <DataTable.Row key={combo.id}>
                <DataTable.Cell>
                  <Text style={styles.menuName}>{combo.name}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.branchName}>
                    {typeof combo.branch === "object"
                      ? combo.branch.address
                      : combo.branch}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.menuPrice}>${combo.combo_price}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Chip
                    mode="outlined"
                    style={styles.customChip}
                    textStyle={styles.customChipText}
                  >
                    {combo.is_custom ? "Yes" : "No"}
                  </Chip>
                </DataTable.Cell>
                <DataTable.Cell>
                  <View style={styles.actionsContainer}>
                    <Button
                      mode="text"
                      onPress={() => {
                        setSelectedItem(combo);
                        setShowEditComboDialog(true);
                      }}
                      style={styles.actionButton}
                    >
                      <Icon source="pencil" size={20} color="#007AFF" />
                    </Button>
                    <Button
                      mode="text"
                      onPress={() => {
                        setMenuID(combo.id!);
                        setShowDialog(true);
                      }}
                      style={styles.actionButton}
                    >
                      <Icon source="delete" size={20} color="#FF3B30" />
                    </Button>
                  </View>
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </View>
      )}

      {/* Add Menu Modal */}
      <AddMenuModal
        visible={showAddMenuModal}
        onClose={() => {
          setShowAddMenuModal(false);
          queryClient.invalidateQueries({ queryKey: ["menus"] });
        }}
      />

      {/* Add Combo Modal */}
      <AddComboModal
        visible={showAddComboModal}
        onClose={() => {
          setShowAddComboModal(false);
          queryClient.invalidateQueries({ queryKey: ["combos"] });
        }}
      />

      {/* Related Items Modal */}
      <Portal>
        <Modal
          visible={showRelatedModal}
          onDismiss={() => setShowRelatedModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>
                For: {currentMenuItem?.name}
              </Text>
            </View>

            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search by Item name"
                onChangeText={setModalSearchQuery}
                value={modalSearchQuery}
                style={styles.searchBar}
                inputStyle={styles.inputStyle}
                placeholderTextColor={"#2E191466"}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryContainer}
            >
              {categoryOptions.map((category) => (
                <Chip
                  key={category}
                  mode="outlined"
                  selected={modalSelectedCategory === category}
                  onPress={() => setModalSelectedCategory(category)}
                  style={[
                    styles.categoryChip,
                    modalSelectedCategory === category &&
                      styles.selectedCategoryChip,
                  ]}
                  textStyle={[
                    styles.categoryChipText,
                    modalSelectedCategory === category &&
                      styles.selectedCategoryChipText,
                  ]}
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>

            <ScrollView style={styles.itemsContainer}>
              {modalFilteredMenus?.map((menu) => {
                const categories = getMenuCategories(menu);
                const categoriesLabel = categories.length
                  ? categories.join(", ")
                  : "—";

                return (
                <View key={menu.id} style={styles.itemRow}>
                  <Checkbox.Android
                    status={
                      selectedItems.includes(menu.id || "")
                        ? "checked"
                        : "unchecked"
                    }
                    onPress={() => toggleItemSelection(menu.id || "")}
                  />
                  <Image
                    source={{ uri: menu.image }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{menu.name}</Text>
                    <Text style={styles.categoryText}>{categoriesLabel}</Text>
                  </View>
                  <Text style={styles.itemPrice}>${menu.price}</Text>
                </View>
              );
              })}
            </ScrollView>
          </View>
          <View style={styles.modalFooter}>
            <View style={styles.footerActions}>
              <Button
                mode="contained"
                onPress={handleAddRelatedItems}
                icon="plus"
                textColor="#fff"
                style={styles.addItemButton}
                labelStyle={{ color: "#fff", fontWeight: "600", fontSize: 17 }}
                disabled={selectedItems.length === 0 || !tag}
              >
                Add Item
              </Button>
              <Text style={styles.selectedItemsText}>
                {selectedItems.length} items selected
              </Text>
            </View>
          </View>
        </Modal>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => setShowDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete this{" "}
              {activeTab === "all" ? "menu item" : "combo"}? This action cannot
              be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteMenu}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
      <EditMenuDialog
        visible={showEditMenuDialog}
        menu={selectedItem}
        onClose={() => {
          setShowEditMenuDialog(false);
          queryClient.invalidateQueries({ queryKey: ["menus"] });
        }}
      />

      <EditComboDialog
        visible={showEditComboDialog}
        combo={selectedItem}
        onClose={() => {
          setShowEditComboDialog(false);
          queryClient.invalidateQueries({ queryKey: ["combos"] });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF4EB",
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: "600",
    color: "#22281B",
    marginBottom: 12,
  },
  branchSelector: {
    marginBottom: 16,
  },
  branchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  branchLabel: {
    color: "#5F7A3D",
    fontWeight: "500",
    marginRight: 12,
  },
  branchChips: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  branchChip: {
    borderRadius: 100,
    backgroundColor: "#91B27517",
    borderColor: "#91B275",
    borderWidth: 0,
    height: 32,
  },
  selectedBranchChip: {
    backgroundColor: "#96B76E",
  },
  branchChipText: {
    color: "#5F7A3D",
    fontSize: 12,
    fontWeight: "500",
  },
  selectedBranchChipText: {
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: "#91B27517",
    borderRadius: 100,
    height: 40,
    elevation: 0,
  },
  searchInput: {
    color: "#22281B",
    fontSize: 14,
    minHeight: 40,
    paddingBottom: 0,
    paddingTop: 0,
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 100,
    height: 40,
  },
  addButtonLabel: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  categoryChip: {
    borderRadius: 100,
    backgroundColor: "#91B27517",
    borderColor: "#91B275",
    borderWidth: 0,
    height: 32,
  },
  selectedCategoryChip: {
    backgroundColor: "#96B76E",
  },
  categoryChipText: {
    color: "#5F7A3D",
    fontSize: 12,
    fontWeight: "500",
  },
  selectedCategoryChipText: {
    color: "#FFFFFF",
  },
  tabContainer: {
    borderColor: "#5E6E4933",
    borderBottomWidth: 1,
  },
  tabGroup: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    borderRadius: 6,
    padding: 2,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: "#96B76E",
  },
  tabLabel: {
    color: "#8D8D8D",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabLabel: {
    color: "#96B76E",
  },
  card: {
    backgroundColor: "#EFF4EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  loader: {
    marginVertical: 24,
  },
  tableHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#20291933",
  },
  imageHeader: {
    width: 60,
  },
  tableTitle: {
    fontWeight: "500",
    color: "#4A4A4A",
    fontSize: 13,
  },
  tableRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#20291933",
  },
  imageCell: {
    width: 62,
    justifyContent: "flex-start",
  },
  menuImage: {
    width: 61,
    height: 62,
    borderRadius: 10,
  },
  menuName: {
    fontWeight: "500",
    color: "#22281B",
    fontSize: 17,
  },
  branchName: {
    color: "#5F7A3D",
    fontSize: 17,
  },
  categoryTag: {
    color: "#40392B",
    fontSize: 17,
  },
  customChip: {
    backgroundColor: "#E9F0F7",
    borderColor: "#7591B2",
    height: 24,
  },
  customChipText: {
    color: "#3D5F7A",
    fontSize: 12,
  },
  menuPrice: {
    fontWeight: "500",
    color: "#22281B",
    fontSize: 17,
  },
  relatedButton: {
    borderColor: "#6E504933",
    borderWidth: 1.5,
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
  },
  relatedButtonLabel: {
    color: "#281D1B",
    fontSize: 15,
    fontWeight: "500",
    alignSelf: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    minWidth: 0,
    padding: 0,
  },
  deleteButtonContent: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#91B275",
    borderRadius: 50,
    width: 25,
    height: 25,
  },
  deleteButtonLabel: {
    color: "#fff",
    fontWeight: "500",
    marginHorizontal: 10,
  },
  toggleContainer: {
    marginLeft: 4,
  },
  modalContainer: {
    backgroundColor: "#EBF1E6",
    borderRadius: 13,
    width: "90%",
    maxWidth: 300,
    alignSelf: "center",
    maxHeight: "80%",
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalHeaderText: {
    fontWeight: "600",
    color: "#2E191466",
    fontSize: 16,
  },
  inputStyle: {
    color: "#2E191466",
    fontSize: 15,
    fontWeight: "400",
  },
  itemsContainer: {
    maxHeight: 300,
    marginBottom: 16,
    borderWidth: 0,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: "500",
    color: "#22281B",
  },
  categoryText: {
    color: "#5F7A3D",
    fontSize: 12,
  },
  itemPrice: {
    fontWeight: "500",
    color: "#22281B",
  },
  modalFooter: {
    padding: 16,
    backgroundColor: "#F9FFF4",
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 13,
  },
  footerActions: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addItemButton: {
    backgroundColor: "#91B275",
    borderRadius: 100,
    height: 36,
    width: "100%",
  },
  selectedItemsText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "400",
    color: "#2E191466",
  },
  dialog: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  snackbar: {
    backgroundColor: "#91B275",
    margin: 16,
    borderRadius: 8,
  },
});
