import React, { useState, useMemo, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  DataTable,
  Portal,
  Dialog,
  Searchbar,
  Checkbox,
  Chip,
  Modal,
  ActivityIndicator,
  Snackbar,
  Paragraph,
} from 'react-native-paper';
import {
  useDeleteMenu,
  useGetMenus,
  useGetMenuAvailabilities,
  useAddRelatedMenuItem,
  useGetRelatedMenus,
} from '@/services/mutation/menuMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import {
  useDeleteCombo,
  useGetCombos,
} from '@/services/mutation/comboMutation';
import BranchSelector from '@/components/BranchSelector';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import AddMenuModal from './addMenu';
import AddComboModal from '../combos/addCombo';
import EditMenuDialog from './[menuId]';
import EditComboDialog from '../combos/[comboId]';
import Pagination from '@/components/Pagination';
import debounce from 'lodash.debounce';
import { MenuType } from '@/types/menuType';
import { i18n as I18n } from '@/app/_layout';

export default function Menus() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { mutateAsync: menuDelete } = useDeleteMenu();

  const { data: relatedMenus } = useGetRelatedMenus(undefined, true);
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();

  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = React.useState(false);
  const [menuID, setMenuID] = React.useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState<'all' | 'combos'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    isBranch ? branchId ?? null : null
  );
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Modal states
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [showAddComboModal, setShowAddComboModal] = useState(false);

  // Related items modal state
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Separate state for main table and modal
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [mainSelectedCategory, setMainSelectedCategory] = useState('All');
  const [combosSearchQuery, setCombosSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalSelectedCategory, setModalSelectedCategory] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debouncedSearch = useMemo(
    () => debounce((q: string) => setDebouncedQuery(q), 300),
    []
  );
  const [showEditMenuDialog, setShowEditMenuDialog] = useState(false);
  const [showEditComboDialog, setShowEditComboDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const { mutateAsync: createRelatedItem } = useAddRelatedMenuItem();
  const { mutateAsync: deleteCombo } = useDeleteCombo();
  const DEFAULT_CATEGORIES = ['Main course', 'Pasta', 'Dessert', 'Drink'];

  const queryParams = useMemo(() => {
    const category = mainSelectedCategory === 'All' ? '' : mainSelectedCategory;
    return {
      page: currentPage,
      category,
      branch: selectedBranch === 'all' ? undefined : selectedBranch,
      search: debouncedQuery,
    };
  }, [currentPage, mainSelectedCategory, selectedBranch, debouncedQuery]);
  const { data: menus, isLoading: isMenusLoading } =
    useGetMenuAvailabilities(queryParams);

  const queryParamsCombo = useMemo(() => {
    return {
      page: currentPage,
      branch: selectedBranch === 'all' ? undefined : selectedBranch,
      search: debouncedQuery,
    };
  }, [currentPage, selectedBranch, debouncedQuery]);
  const { data: combos, isLoading: isCombosLoading } = useGetCombos(
    queryParamsCombo,
    activeTab === 'combos'
  );

  const { data: rawMenu } = useGetMenus(undefined, true);

  useEffect(() => {
    if (currentMenuItem) {
      const relatedItemExists = relatedMenus?.find(
        (it) => (it.menu_item as any).id == currentMenuItem.id
      );
      if (relatedItemExists) {
        setSelectedItems(
          relatedMenus!
            .filter((it) => (it.menu_item as any).id == currentMenuItem.id)
            .map((it) => (it.related_item as any).id)
        );
      }
    }
  }, [currentMenuItem, showRelatedModal]);

  const getMenuCategories = (menu: any): string[] => {
    if (Array.isArray(menu?.categories) && menu?.categories?.length) {
      return menu.categories;
    }
    if (Array.isArray(menu?.category) && menu?.category?.length) {
      return menu.category.filter((value: any) => typeof value === 'string');
    }
    if (typeof menu?.category === 'string' && menu.category) {
      return [menu.category];
    }
    return [];
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_CATEGORIES);
    menus?.results.forEach((menuItem) => {
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
    queryClient.invalidateQueries({ queryKey: ['menus'] });
    dispatch(hideLoader());
  };

  const handleDeleteCombo = async () => {
    setMenuID(null);
    setShowDialog(false);
    dispatch(showLoader());
    await deleteCombo(menuID!);
    queryClient.invalidateQueries({ queryKey: ['combos'] });
    dispatch(hideLoader());
  };

  const openRelatedModal = (menu: any) => {
    setCurrentMenuItem(menu);
    setModalSearchQuery('');
    setModalSelectedCategory('All');
    setSelectedItems([]);
    setShowRelatedModal(true);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleRelatedItemsActions = async () => {
    setShowRelatedModal(false);
    await createRelatedItem({
      menu_item: currentMenuItem.id,
      related_items: selectedItems,
    });
    await queryClient.invalidateQueries({ queryKey: ['relatedMenus'] });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          {I18n.t('menus.title')}
        </Text>
        <BranchSelector
          selectedBranch={selectedBranch}
          onChange={(branchid) => {
            setCurrentPage(1);
            setSelectedBranch(branchid);
          }}
          includeAllOption={isRestaurant}
          style={styles.branchSelector}
        />
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={
              activeTab === 'all'
                ? I18n.t('menus.search.placeholder_item')
                : I18n.t('menus.search.placeholder_combo')
            }
            value={activeTab === 'all' ? mainSearchQuery : combosSearchQuery}
            onChangeText={(text) => {
              if (activeTab === 'all') {
                setMainSearchQuery(text);
                debouncedSearch(text);
                setCurrentPage(1);
              } else {
                setCombosSearchQuery(text);
                debouncedSearch(text);
                setCurrentPage(1);
              }
            }}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            placeholderTextColor="#8D8D8D"
          />
          <Button
            mode="contained"
            onPress={() =>
              activeTab === 'all'
                ? setShowAddMenuModal(true)
                : setShowAddComboModal(true)
            }
            style={styles.addButton}
            labelStyle={styles.addButtonLabel}
          >
            +{' '}
            {activeTab === 'all'
              ? I18n.t('menus.button.add_item_text')
              : I18n.t('menus.button.add_combo_text')}
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
            {I18n.t('menus.category.' + category)}
          </Chip>
        ))}
      </ScrollView>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'all' && styles.activeTabLabel,
              ]}
            >
              {I18n.t('menus.tabs.all_items')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'combos' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('combos')}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'combos' && styles.activeTabLabel,
              ]}
            >
              {I18n.t('menus.tabs.combos')}
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
      {activeTab === 'all' && !isMenusLoading && (
        <View style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.imageHeader}>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.image')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.name')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.category')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.price')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.related_items')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.actions')}
                </Text>
              </DataTable.Title>
            </DataTable.Header>

            {menus?.results?.map((menu) => {
              return (
                <DataTable.Row key={menu.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.imageCell}>
                    <Image
                      source={{ uri: (menu.menu_item as MenuType)?.image }}
                      style={styles.menuImage}
                    />
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.menuName}>{menu.menu_item.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.categoryTag}>
                      {menu.menu_item.category}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Text style={styles.menuPrice}>
                      ${menu.menu_item.price}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Button
                      mode="outlined"
                      onPress={() => openRelatedModal(menu)}
                      style={styles.relatedButton}
                      labelStyle={styles.relatedButtonLabel}
                    >
                      {relatedMenus?.find(
                        (it) => (it.menu_item as any).id == menu.id
                      )
                        ? I18n.t('menus.button.update_related_item')
                        : I18n.t('menus.button.add_related_item')}
                    </Button>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <View style={styles.actionsContainer}>
                      <Button
                        mode="text"
                        onPress={() => {
                          setSelectedItem(menu.menu_item);
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
                          setMenuID(menu.menu_item.id!);
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
      {activeTab === 'combos' && !isCombosLoading && (
        <View style={styles.card}>
          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.name')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.branch')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.price')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.custom')}
                </Text>
              </DataTable.Title>
              <DataTable.Title>
                {' '}
                <Text style={styles.tableTitle}>
                  {I18n.t('menus.table.actions')}
                </Text>
              </DataTable.Title>
            </DataTable.Header>

            {combos?.results?.map((combo) => (
              <DataTable.Row key={combo.id}>
                <DataTable.Cell>
                  <Text style={styles.menuName}>{combo.name}</Text>
                </DataTable.Cell>
                <DataTable.Cell>
                  <Text style={styles.branchName}>
                    {typeof combo.branch === 'object'
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
                    {combo.is_custom
                      ? I18n.t('menus.combo.custom_yes')
                      : I18n.t('menus.combo.custom_no')}
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
                      icon="pencil-outline"
                      contentStyle={styles.deleteButtonContent}
                      labelStyle={styles.deleteButtonLabel}
                      style={styles.actionButton}
                    />
                    <Button
                      mode="text"
                      onPress={() => {
                        setMenuID(combo.id!);
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
            ))}
          </DataTable>
        </View>
      )}
      <Pagination
        totalPages={
          Math.round(
            activeTab == 'all'
              ? Math.ceil((menus?.count ?? 0) / 10)
              : Math.ceil((combos?.count ?? 0) / 10)
          ) || 0
        }
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      {/* Add Menu Modal */}
      <AddMenuModal
        visible={showAddMenuModal}
        onClose={() => {
          setShowAddMenuModal(false);
          queryClient.invalidateQueries({ queryKey: ['menus'] });
        }}
      />

      {/* Add Combo Modal */}
      <AddComboModal
        visible={showAddComboModal}
        onClose={() => {
          setShowAddComboModal(false);
          queryClient.invalidateQueries({ queryKey: ['combos'] });
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
                placeholder={I18n.t('menus.related_modal.search_placeholder')}
                onChangeText={(text) => {
                  setCurrentPage(1);
                  setModalSearchQuery(text);
                }}
                value={modalSearchQuery}
                style={styles.searchBar}
                inputStyle={styles.inputStyle}
                placeholderTextColor={'#2E191466'}
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
              {rawMenu?.results?.map((menu: any) => {
                const categories = getMenuCategories(menu);
                const categoriesLabel = categories.length
                  ? categories.join(', ')
                  : '—';

                return (
                  <View key={menu.id} style={styles.itemRow}>
                    <Checkbox.Android
                      status={
                        selectedItems.includes(menu.id || '')
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() => toggleItemSelection(menu.id || '')}
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
                onPress={handleRelatedItemsActions}
                icon="plus"
                textColor="#fff"
                style={styles.addItemButton}
                labelStyle={{ color: '#fff', fontWeight: '600', fontSize: 17 }}
                disabled={selectedItems.length === 0}
              >
                {currentMenuItem &&
                relatedMenus?.find(
                  (it) => (it.menu_item as any).id == currentMenuItem.id
                )
                  ? I18n.t('menus.button.update_item')
                  : I18n.t('menus.button.add_item')}
              </Button>
              <Text style={styles.selectedItemsText}>
                {selectedItems.length}{' '}
                {I18n.t('menus.related_modal.selected_count', {
                  count: selectedItems.length,
                })}
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
          <Dialog.Title style={{ color: '#000' }}>
            {I18n.t('menus.dialog.delete_title')}
          </Dialog.Title>
          <Dialog.Content>
            <Paragraph style={{ color: '#000' }}>
              {I18n.t('menus.dialog.delete_confirmation', {
                type: activeTab === 'all' ? 'menu item' : 'combo',
              })}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDialog(false)}
              labelStyle={{ color: '#000' }}
            >
              {I18n.t('menus.dialog.cancel_button')}
            </Button>
            <Button
              onPress={
                activeTab === 'all' ? handleDeleteMenu : handleDeleteCombo
              }
              labelStyle={{ color: 'red' }}
            >
              {I18n.t('menus.dialog.delete_button')}
            </Button>
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
          queryClient.invalidateQueries({ queryKey: ['menus'] });
        }}
      />

      <EditComboDialog
        visible={showEditComboDialog}
        combo={selectedItem}
        onClose={() => {
          setShowEditComboDialog(false);
          queryClient.invalidateQueries({ queryKey: ['combos'] });
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4EB',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    color: '#22281B',
    marginBottom: 12,
  },
  branchSelector: {
    marginBottom: 16,
  },
  branchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  branchLabel: {
    color: '#5F7A3D',
    fontWeight: '500',
    marginRight: 12,
  },
  branchChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  branchChip: {
    borderRadius: 100,
    backgroundColor: '#91B27517',
    borderColor: '#91B275',
    borderWidth: 0,
    height: 32,
  },
  selectedBranchChip: {
    backgroundColor: '#96B76E',
  },
  branchChipText: {
    color: '#5F7A3D',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedBranchChipText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    backgroundColor: '#91B27517',
    borderRadius: 100,
    height: 40,
    elevation: 0,
  },
  searchInput: {
    color: '#22281B',
    fontSize: 14,
    minHeight: 40,
    paddingBottom: 0,
    paddingTop: 0,
  },
  addButton: {
    backgroundColor: '#91B275',
    borderRadius: 100,
    height: 40,
  },
  addButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 4,
  },
  categoryChip: {
    borderRadius: 100,
    backgroundColor: '#91B27517',
    borderColor: '#91B275',
    borderWidth: 0,
    height: 32,
  },
  selectedCategoryChip: {
    backgroundColor: '#96B76E',
  },
  categoryChipText: {
    color: '#5F7A3D',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  tabContainer: {
    borderColor: '#5E6E4933',
    borderBottomWidth: 1,
  },
  tabGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderRadius: 6,
    padding: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: '#96B76E',
  },
  tabLabel: {
    color: '#8D8D8D',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#96B76E',
  },
  card: {
    backgroundColor: '#EFF4EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  loader: {
    marginVertical: 24,
  },
  tableHeader: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#20291933',
  },
  imageHeader: {
    width: 60,
  },
  tableTitle: {
    fontWeight: '500',
    color: '#4A4A4A',
    fontSize: 13,
  },
  tableRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#20291933',
  },
  imageCell: {
    width: 62,
    justifyContent: 'flex-start',
  },
  menuImage: {
    width: 61,
    height: 62,
    borderRadius: 10,
  },
  menuName: {
    fontWeight: '500',
    color: '#22281B',
    fontSize: 17,
  },
  branchName: {
    color: '#5F7A3D',
    fontSize: 17,
  },
  categoryTag: {
    color: '#40392B',
    fontSize: 17,
  },
  customChip: {
    backgroundColor: '#E9F0F7',
    borderColor: '#7591B2',
    height: 24,
  },
  customChipText: {
    color: '#3D5F7A',
    fontSize: 12,
  },
  menuPrice: {
    fontWeight: '500',
    color: '#22281B',
    fontSize: 17,
  },
  relatedButton: {
    borderColor: '#6E504933',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 36,
    justifyContent: 'center',
  },
  relatedButtonLabel: {
    color: '#281D1B',
    fontSize: 15,
    fontWeight: '500',
    alignSelf: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    minWidth: 0,
    padding: 0,
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#91B275',
    borderRadius: 50,
    width: 25,
    height: 25,
  },
  deleteButtonLabel: {
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 10,
  },
  toggleContainer: {
    marginLeft: 4,
  },
  modalContainer: {
    backgroundColor: '#EBF1E6',
    borderRadius: 13,
    width: '90%',
    maxWidth: 700,
    alignSelf: 'center',
    maxHeight: '80%',
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalHeaderText: {
    fontWeight: '600',
    color: '#2E191466',
    fontSize: 16,
  },
  inputStyle: {
    color: '#2E191466',
    fontSize: 15,
    fontWeight: '400',
  },
  itemsContainer: {
    maxHeight: 300,
    marginBottom: 16,
    borderWidth: 0,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    fontWeight: '500',
    color: '#22281B',
  },
  categoryText: {
    color: '#5F7A3D',
    fontSize: 12,
  },
  itemPrice: {
    fontWeight: '500',
    color: '#22281B',
  },
  modalFooter: {
    padding: 16,
    backgroundColor: '#F9FFF4',
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 13,
  },
  footerActions: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addItemButton: {
    backgroundColor: '#91B275',
    borderRadius: 100,
    height: 36,
    width: '100%',
  },
  selectedItemsText: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '400',
    color: '#2E191466',
  },
  dialog: {
    backgroundColor: '#EFF4EB',
    borderRadius: 12,
    padding: 16,
    maxWidth: 700,
    alignSelf: 'center',
  },
  snackbar: {
    backgroundColor: '#91B275',
    margin: 16,
    borderRadius: 8,
  },
});
