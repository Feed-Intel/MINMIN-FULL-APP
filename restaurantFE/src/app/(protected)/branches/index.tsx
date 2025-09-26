import React, { useState } from 'react';
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

export default function Branches() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data: branches } = useGetBranches(currentPage);
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

  const handleToggleDefault = async (branch: any) => {
    try {
      dispatch(showLoader());
      await updateBranch({
        ...branch,
        is_default: !branch.is_default,
      });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      dispatch(hideLoader());
    } catch (error) {
      console.error('Error updating branch:', error);
    }
  };

  const filteredBranches = branches?.results.filter((branch) =>
    branch?.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          Branches
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
              placeholder="search by name"
              placeholderTextColor="#2E191466"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!isBranch && (
              <Button
                mode="contained"
                onPress={() => setShowAddDialog(true)}
                style={styles.addButton}
                textColor="#fff"
              >
                + Add branch
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
                  <Text style={styles.tableTitle}>Branch</Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>Latitude</Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>Longitude</Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>Set on map</Text>
                </DataTable.Title>
                <DataTable.Title>
                  <Text style={styles.tableTitle}>Actions</Text>
                </DataTable.Title>
              </DataTable.Header>

              {filteredBranches?.map((branch) => {
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
                      <Text style={styles.tableTitle2}>Set on map</Text>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {!isBranch ? (
                        <View style={styles.actionButtons}>
                          <View style={styles.switchContainer}>
                            <Switch
                              value={branch.is_default}
                              onValueChange={() => handleToggleDefault(branch)}
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
                        <Text style={styles.tableTitle2}>View only</Text>
                      )}
                    </DataTable.Cell>
                  </DataTable.Row>
                );
              })}
            </DataTable>
            <Pagination
              totalPages={Math.round(branches?.count! / 10) || 0}
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
          }}
        >
          <Dialog.Title>Confirm Deletion</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this branch? This action cannot be
              undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteBranch}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Add Branch Dialog */}
      <AddBranchDialog
        visible={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          setShowAddDialog(false);
          queryClient.invalidateQueries({ queryKey: ['branches'] });
        }}
      />

      {/* Edit Branch Dialog */}
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
