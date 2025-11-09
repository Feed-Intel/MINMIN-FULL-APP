import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Image,
  FlatList,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import {
  Text,
  Switch,
  Snackbar,
  ActivityIndicator,
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  TextInput,
  DataTable,
  useTheme,
} from 'react-native-paper';
import { useGetBranches } from '@/services/mutation/branchMutation';
import {
  useGetMenus,
  useGetMenuAvailabilities,
  useUpdateMenuAvailability,
} from '@/services/mutation/menuMutation';
import { MenuAvailability as MenuAvailabilityType } from '@/types/menuType';
import { Branch } from '@/types/branchType';
import { MenuType } from '@/types/menuType';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function MenuAvailability() {
  const { width } = useWindowDimensions();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const theme = useTheme();

  const colorScheme = useColorScheme();

  // Screen size breakpoints
  const isSmallScreen = width < 768;

  const { data: branches, isLoading: isBranchesLoading } = useGetBranches();
  const [next, setNext] = useState<string | null | undefined>(null);

  const { data: menus, isLoading: isMenusLoading } = useGetMenus();
  const { data } = useGetMenuAvailabilities(next);
  const [menuAvailabilites, setMenuAvailabilites] = useState<
    MenuAvailabilityType[]
  >([]);

  useEffect(() => {
    if (data?.results) {
      setMenuAvailabilites((prev) => [...prev, ...data?.results]);
    }
  }, [data]);

  useEffect(() => {
    if (data?.next) {
      setNext(data?.next);
    }
  }, [data]);

  const { mutate: toggleAvailability, isPending: isToggleLoading } =
    useUpdateMenuAvailability();

  const handleToggle = async (
    branchId: string,
    menuItemId: string,
    isAvailable: boolean
  ) => {
    try {
      await toggleAvailability({
        branch: branchId,
        menu_item: menuItemId,
        is_available: isAvailable,
      });
      setSnackbarMessage('Menu availability updated successfully!');
      setSnackbarVisible(true);

      setMenuAvailabilites((prev) =>
        prev.map((item) =>
          (typeof item.branch === 'object' && 'id' in item.branch
            ? item.branch.id
            : item.branch) === branchId &&
          (typeof item.menu_item === 'object' && 'id' in item.menu_item
            ? item.menu_item.id
            : item.menu_item) === menuItemId
            ? { ...item, is_available: isAvailable }
            : item
        )
      );
    } catch (error) {
      setSnackbarMessage('Failed to update menu availability');
      setSnackbarVisible(true);
    }
  };

  const getAvailabilityStatus = (branchId: string, menuId: string) => {
    const availability = menuAvailabilites.find(
      (avail) =>
        (typeof avail.branch === 'object' && 'id' in avail.branch
          ? avail.branch.id
          : avail.branch) === branchId &&
        (typeof avail.menu_item === 'object' && 'id' in avail.menu_item
          ? avail.menu_item.id
          : avail.menu_item) === menuId
    );

    return availability ? availability.is_available : false;
  };

  if (isBranchesLoading || isMenusLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          animating={true}
          size={isSmallScreen ? 'small' : 'large'}
          color={theme.colors.primary}
        />
      </View>
    );
  }

  if (!selectedBranch) {
    return (
      <BranchSelectionScreen
        branches={branches?.results || []}
        onSelectBranch={setSelectedBranch}
        isSmallScreen={isSmallScreen}
        colorScheme={colorScheme ?? null}
      />
    );
  }

  return (
    <MenuAvailabilityScreen
      branch={selectedBranch}
      menus={menus?.results || []}
      menuAvailabilites={menuAvailabilites}
      getAvailabilityStatus={getAvailabilityStatus}
      handleToggle={handleToggle}
      onBack={() => setSelectedBranch(null)}
      isToggleLoading={isToggleLoading}
      isSmallScreen={isSmallScreen}
      snackbarVisible={snackbarVisible}
      snackbarMessage={snackbarMessage}
      setSnackbarVisible={setSnackbarVisible}
      colorScheme={colorScheme ?? null}
    />
  );
}

interface BranchSelectionScreenProps {
  branches: Branch[];
  onSelectBranch: (branch: Branch) => void;
  isSmallScreen: boolean;
  colorScheme: 'light' | 'dark' | null;
}

const BranchSelectionScreen: React.FC<BranchSelectionScreenProps> = ({
  branches,
  onSelectBranch,
  isSmallScreen,
  colorScheme,
}) => {
  const theme = useTheme();
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 16,
      paddingBottom: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onPrimary,
      flex: 1,
      marginLeft: 10,
    },
    tableContainer: {
      margin: 16,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      elevation: 3,
    },
    tableHeader: {
      backgroundColor: theme.colors.primary,
    },
    headerCell: {
      justifyContent: 'center',
    },
    headerText: {
      color: theme.colors.onPrimary,
      fontWeight: 'bold',
    },
    tableRow: {
      backgroundColor: theme.colors.surface,
    },
    tableCell: {
      justifyContent: 'center',
      paddingVertical: 12,
    },
    cellText: {
      color: theme.colors.onSurface,
    },
    selectButton: {
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 8,
    },
    buttonText: {
      color: theme.colors.onSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select a Branch</Text>
      </View>

      <DataTable style={styles.tableContainer}>
        <DataTable.Header style={styles.tableHeader}>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Address</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Coordinates</Text>
          </DataTable.Title>
          <DataTable.Title style={styles.headerCell}>
            <Text style={styles.headerText}>Action</Text>
          </DataTable.Title>
        </DataTable.Header>

        {branches.map((branch) => (
          <DataTable.Row key={branch.id} style={styles.tableRow}>
            <DataTable.Cell style={styles.tableCell}>
              <Text style={styles.cellText}>{branch.address}</Text>
            </DataTable.Cell>
            <DataTable.Cell style={styles.tableCell}>
              <Text style={styles.cellText}>
                {branch.gps_coordinates || 'N/A'}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell style={styles.tableCell}>
              <Button
                mode="contained"
                onPress={() => onSelectBranch(branch)}
                style={styles.selectButton}
                labelStyle={styles.buttonText}
              >
                Select
              </Button>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
};

interface MenuAvailabilityScreenProps {
  branch: Branch;
  menus: MenuType[];
  menuAvailabilites: MenuAvailabilityType[];
  getAvailabilityStatus: (branchId: string, menuId: string) => boolean;
  handleToggle: (
    branchId: string,
    menuItemId: string,
    isAvailable: boolean
  ) => void;
  onBack: () => void;
  isToggleLoading: boolean;
  isSmallScreen: boolean;
  snackbarVisible: boolean;
  snackbarMessage: string;
  setSnackbarVisible: (visible: boolean) => void;
  colorScheme: 'light' | 'dark' | null;
}

const MenuAvailabilityScreen: React.FC<MenuAvailabilityScreenProps> = ({
  branch,
  menus,
  menuAvailabilites,
  getAvailabilityStatus,
  handleToggle,
  onBack,
  isToggleLoading,
  isSmallScreen,
  snackbarVisible,
  snackbarMessage,
  setSnackbarVisible,
  colorScheme,
}) => {
  const theme = useTheme();

  const renderMenuItem = ({ item }: { item: MenuType }) => {
    const categories =
      Array.isArray(item.categories) && item.categories.length
        ? item.categories
        : item.category
        ? [item.category]
        : [];

    return (
      <Card style={styles.menuCard}>
        <Card.Content>
          <View style={styles.menuHeader}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.menuImage} />
            ) : (
              <View style={[styles.menuImage, styles.imagePlaceholder]}>
                <MaterialCommunityIcons
                  name="image-off"
                  size={32}
                  color={theme.colors.outline}
                />
              </View>
            )}
            <View style={styles.menuInfo}>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuPrice}>${item.price}</Text>
              <View style={styles.chipContainer}>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Chip key={category} style={styles.categoryChip}>
                      {category}
                    </Chip>
                  ))
                ) : (
                  <Chip style={styles.categoryChip}>—</Chip>
                )}
                {item.is_side && (
                  <Chip style={styles.sideChip} textStyle={styles.sideChipText}>
                    Side Dish
                  </Chip>
                )}
              </View>
            </View>
          </View>

          <Text style={styles.menuDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <Divider style={styles.divider} />

          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityLabel}>
              {getAvailabilityStatus(branch.id!, item.id!)
                ? 'Currently Available'
                : 'Not Available'}
            </Text>
            <Switch
              value={getAvailabilityStatus(branch.id!, item.id!)}
              disabled={isToggleLoading}
              onValueChange={(value) =>
                handleToggle(branch.id!, item.id!, value)
              }
              color={theme.colors.primary}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (menu.description &&
        menu.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Fixed: Count only availabilities for the specific branch
  const availableCount = menuAvailabilites.filter(
    (avail) =>
      (typeof avail.branch === 'object' && 'id' in avail.branch
        ? avail.branch.id
        : avail.branch) === branch.id && avail.is_available
  ).length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingTop: 10,
      paddingBottom: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onPrimary,
      flex: 1,
      marginLeft: 10,
    },
    branchTitle: {
      fontSize: 14,
      color: theme.colors.onPrimary,
      width: '100%',
      marginTop: 4,
      marginLeft: 40,
      opacity: 0.9,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 16,
      backgroundColor: theme.colors.surface,
      marginBottom: 4,
      elevation: 2,
    },
    statCard: {
      alignItems: 'center',
      padding: 5,
      borderRadius: 12,
      backgroundColor:
        colorScheme === 'dark'
          ? theme.colors.surfaceVariant
          : theme.colors.secondaryContainer,
      width: '45%',
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    searchCard: {
      margin: 10,
      marginTop: 0,
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    searchInput: {
      backgroundColor: 'transparent',
      height: 50,
      color: theme.colors.onSurface,
    },
    menuList: {
      padding: 12,
      paddingBottom: 32,
    },
    menuCard: {
      marginBottom: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      elevation: 2,
    },
    menuHeader: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    menuImage: {
      width: 80,
      height: 80,
      borderRadius: 12,
      marginRight: 16,
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuInfo: {
      flex: 1,
    },
    menuName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    menuPrice: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginTop: 4,
    },
    menuDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    chipContainer: {
      flexDirection: 'row',
      marginTop: 8,
      flexWrap: 'wrap',
    },
    categoryChip: {
      backgroundColor: theme.colors.secondaryContainer,
      marginRight: 8,
      marginBottom: 4,
    },
    sideChip: {
      backgroundColor: theme.colors.tertiaryContainer,
    },
    sideChipText: {
      color: theme.colors.onTertiaryContainer,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      marginVertical: 12,
    },
    availabilityContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    availabilityLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    snackbar: {
      marginBottom: 24,
      marginHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={theme.colors.onPrimary}
          size={24}
          onPress={onBack}
        />
        <Text style={styles.headerTitle}>Menu Availability</Text>
        <Text style={styles.branchTitle}>{branch.address}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{menus.length}</Text>
          <Text style={styles.statLabel}>Total Menus</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{availableCount}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>

      <Card style={styles.searchCard}>
        <TextInput
          placeholder="Search menus..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchTerm}
          onChangeText={setSearchTerm}
          left={
            <TextInput.Icon
              icon="magnify"
              color={theme.colors.onSurfaceVariant}
            />
          }
          style={styles.searchInput}
          theme={{
            colors: {
              text: theme.colors.onSurface,
              placeholder: theme.colors.onSurfaceVariant,
            },
          }}
        />
      </Card>

      <FlatList
        data={filteredMenus}
        contentContainerStyle={styles.menuList}
        keyExtractor={(item) => item.id!}
        renderItem={renderMenuItem}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
        theme={{ colors: { accent: theme.colors.onPrimary } }}
      >
        <Text style={{ color: theme.colors.onPrimary }}>{snackbarMessage}</Text>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
