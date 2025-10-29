import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import {
  Button,
  DataTable,
  Portal,
  Dialog,
  Text,
  Switch,
} from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDeleteBranch,
  useGetBranches,
  useUpdateBranch,
} from '@/services/mutation/branchMutation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import AddBranchDialog from './addBranch';
import EditBranchDialog from './[branchId]';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import Pagination from '@/components/Pagination';
import { i18n as I18n } from '@/app/_layout';

export default function Branches() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { mutateAsync: branchDelete } = useDeleteBranch();
  const { mutateAsync: updateBranch } = useUpdateBranch();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [branchID, setBranchID] = React.useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = React.useState<any>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowDimensions();
  const { isBranch } = useRestaurantIdentity();
  const [defaultBranches, setActiveBranches] = useState<{
    [key: string]: boolean;
  }>({});

  const queryParams = useMemo(() => {
    return {
      page: currentPage,
      search: searchQuery,
    };
  }, [currentPage, searchQuery]);
  const { data: branches } = useGetBranches(queryParams);

  useEffect(() => {
    if (branches) {
      setActiveBranches(
        branches.results.reduce((acc, branch) => {
          acc[branch.id!] = branch.is_default!;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  }, [branches]);

  const handleDeleteBranch = async () => {
    try {
      setBranchID(null);
      setShowDeleteDialog(false);
      dispatch(showLoader());
      await branchDelete(branchID!);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      dispatch(hideLoader());
    } catch (error) {
      setShowDeleteDialog(false);
    }
  };

  const handleToggleDefault = async (branch: any, value: boolean) => {
    try {
      dispatch(showLoader());
      await updateBranch({
        id: branch.id,
        address: branch.address,
        is_default: value,
        lat: branch.location?.lat,
        lng: branch.location?.lng,
        gps_coordinates: branch.gps_coordinates || '',
      });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setActiveBranches((prev) => ({
        ...prev,
        [branch.id!]: value,
      }));
      dispatch(hideLoader());
    } catch (error) {
      console.error('Error updating branch:', error);
    }
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingHorizontal: width > 900 ? '0%' : 16 },
        ]}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            margin: 16,
            color: '#21281B',
          }}
        >
          {I18n.t('Branch.branches_title')}
        </Text>
        <View
          style={[
            styles.card,
            {
              width: '100%',
              maxWidth: '100%',
              alignSelf: 'center',
            },
          ]}
        >
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={I18n.t('Branch.search_placeholder_address')}
              placeholderTextColor="#2E191466"
              value={searchQuery}
              onChangeText={(text) => {
                setCurrentPage(1);
                setSearchQuery(text);
              }}
            />
            {!isBranch && (
              <Button
                mode="contained"
                onPress={() => setShowAddDialog(true)}
                style={styles.addButton}
                textColor="#fff"
              >
                {I18n.t('Branch.button_add_branch')}
              </Button>
            )}
          </View>

          <ScrollView style={styles.tableContainer}>
            <DataTable>
              <DataTable.Header
                style={{
                  borderBottomColor: '#20291933',
                  borderBottomWidth: 1.5,
                }}
              >
                <DataTable.Title>
                  <Text style={styles.tableTitle}>
                    {I18n.t('Branch.table_header_branch')}
                  </Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>
                    {I18n.t('Branch.table_header_latitude')}
                  </Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>
                    {I18n.t('Branch.table_header_longitude')}
                  </Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>
                    {I18n.t('Branch.table_header_set_on_map')}
                  </Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>
                    {I18n.t('Branch.table_header_actions')}
                  </Text>
                </DataTable.Title>
              </DataTable.Header>

              {branches?.results?.map((branch) => {
                const [latitude, longitude] = branch.location
                  ? [branch.location.lat, branch.location.lng]
                  : ['1', '1'];

                return (
                  <DataTable.Row key={branch.id} style={styles.tableRow}>
                    <DataTable.Cell>
                      <Text style={styles.tableTitle2}>{branch.address}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text style={styles.tableTitle2}>{latitude}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text style={styles.tableTitle2}>{longitude}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text style={styles.tableTitle2}>
                        {I18n.t('Branch.table_cell_set_on_map')}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {!isBranch ? (
                        <View style={styles.actionButtons}>
                          <View style={styles.switchContainer}>
                            <Switch
                              value={defaultBranches[branch.id!] || false}
                              onValueChange={(value) =>
                                handleToggleDefault(branch, value)
                              }
                              color="#96B76E"
                              trackColor={{ false: '#96B76E', true: '#96B76E' }}
                              thumbColor={branch.is_default ? '#fff' : '#fff'}
                            />
                          </View>
                          <Button
                            icon="pencil"
                            mode="text"
                            textColor="#5A6E5A"
                            onPress={() => {
                              setSelectedBranch(branch);
                              setShowEditDialog(true);
                            }}
                            contentStyle={styles.deleteButtonContent}
                            labelStyle={styles.deleteButtonLabel}
                            style={{ margin: 0, padding: 0 }}
                          />
                          <Button
                            icon="delete"
                            mode="text"
                            textColor="#FF6B6B"
                            onPress={() => {
                              setBranchID(branch.id!);
                              setShowDeleteDialog(true);
                            }}
                            contentStyle={styles.deleteButtonContent}
                            labelStyle={styles.deleteButtonLabel}
                            style={{ margin: 0, padding: 0 }}
                          />
                        </View>
                      ) : (
                        <Text style={styles.tableTitle2}>
                          {I18n.t('Branch.table_cell_view_only')}
                        </Text>
                      )}
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
            <Pagination
              totalPages={Math.ceil((branches?.count || 0) / 10)}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </ScrollView>
        </View>
      </ScrollView>

      {/* Delete Dialog */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={{
            width: width > 500 ? '80%' : '95%',
            alignSelf: 'center',
            backgroundColor: '#EFF4EB',
          }}
        >
          <Dialog.Title>{I18n.t('Branch.dialog_delete_title')}</Dialog.Title>
          <Dialog.Content>
            <Text>{I18n.t('Branch.dialog_delete_message')}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>
              {I18n.t('Branch.button_cancel')}
            </Button>
            <Button onPress={handleDeleteBranch} labelStyle={{ color: 'red' }}>
              {I18n.t('Branch.button_delete')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Branch Dialog (Content not shown/modified) */}
      <AddBranchDialog
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          setShowAddDialog(false);
          queryClient.invalidateQueries({
            queryKey: ['branches', currentPage],
          });
        }}
      />

      {/* Edit Branch Dialog (Content not shown/modified) */}
      <EditBranchDialog
        visible={showEditDialog}
        branch={selectedBranch}
        onClose={() => setShowEditDialog(false)}
        onSuccess={() => {
          setShowEditDialog(false);
          queryClient.invalidateQueries({ queryKey: ['branches'] });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#EFF4EB',
    padding: 6,
  },
  card: {
    backgroundColor: '#EFF4EB',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#91B27517',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 36,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#96B76E',
    borderRadius: 16,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 16,
    elevation: 0,
  },
  tableContainer: {
    backgroundColor: '#EFF4EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tableTitle: {
    fontWeight: '500',
    color: '#4A4A4A',
    fontSize: 13,
  },
  tableTitle2: {
    fontWeight: '500',
    color: '#4A4A4A',
    fontSize: 17,
  },
  tableRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#20291933',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  switchContainer: {
    flexDirection: 'row',
  },
  switchLabel: {
    color: '#666',
    fontSize: 12,
  },
});
