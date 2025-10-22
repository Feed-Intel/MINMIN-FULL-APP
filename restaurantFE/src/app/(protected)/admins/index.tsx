import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Dimensions,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Dialog,
  Portal,
  Switch,
  Menu,
} from 'react-native-paper';
import {
  useCreateBranchAdmin,
  useDeleteBranchAdmin,
  useGetBranchAdmins,
  useUpdateBranchAdmin,
} from '@/services/mutation/branchAdminMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import Pencil from '@/assets/icons/Pencil.svg';
import Delete from '@/assets/icons/Delete.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BranchAdmins() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data: branchAdmins } = useGetBranchAdmins(currentPage);
  const { mutateAsync: adminDelete } = useDeleteBranchAdmin();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = React.useState(false);
  const [adminID, setAdminID] = React.useState<string | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = React.useState(false);
  const { data: branches } = useGetBranches();
  const [admin, setAdmin] = useState<{} | null>(null);

  const handleDeleteAdmin = async () => {
    try {
      setShowDialog(false);
      dispatch(showLoader());
      await adminDelete(adminID!);
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      dispatch(hideLoader());
      setAdminID(null);
    } catch (error) {
      setShowDialog(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Branch admins</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          placeholder="search by Item name or Catagory"
          style={styles.searchBar}
          placeholderTextColor="#999"
        />
        <Button
          mode="contained"
          onPress={() => setShowAddAdminModal(true)}
          style={styles.addButton}
          labelStyle={{ fontSize: 14, color: '#fff' }}
        >
          + Add Admin
        </Button>
      </View>

      {/* Table */}
      <Card style={styles.card} mode="outlined">
        <Card.Content style={{ paddingHorizontal: 0 }}>
          {/* Removed ScrollView horizontal wrapper */}
          <View style={styles.dataTable}>
            <View style={styles.dataTableHeader}>
              {[
                'Full Name',
                'Email Address',
                'Phone Number',
                'Branch',
                'Actions',
              ].map((title, index) => (
                <Text
                  key={index}
                  style={[
                    styles.headerCell,
                    {
                      flex: COLUMN_WIDTHS[index],
                      textAlign: index === 0 ? 'left' : 'center',
                      position: 'relative',
                      left: index === 0 ? 20 : 0,
                    },
                  ]}
                >
                  {title}
                </Text>
              ))}
            </View>

            {branchAdmins?.results.map((admin) => (
              <View key={admin.id} style={styles.row}>
                <Text
                  style={[
                    styles.cell,
                    { textAlign: 'left', position: 'relative', left: 20 },
                  ]}
                >
                  {admin.full_name}
                </Text>
                <Text style={styles.cell}>{admin.email}</Text>
                <Text style={styles.cell}>{admin.phone}</Text>
                <Text style={styles.cell}>
                  {typeof admin.branch === 'string'
                    ? admin.branch
                    : admin.branch.address}
                </Text>
                <Text style={styles.cell}>
                  <View style={styles.actionContainer}>
                    <Switch
                      value={true}
                      onValueChange={() => {}}
                      color="#91B275"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setAdmin({
                          id: admin.id,
                          full_name: admin.full_name,
                          email: admin.email,
                          phone: admin.phone,
                          branch: (admin.branch as any).id,
                        })
                      }
                    >
                      <Pencil height={40} width={40} color="#91B275" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setAdminID(admin.id!);
                        setShowDialog(true);
                      }}
                    >
                      <Delete height={40} width={40} color="#91B275" />
                    </TouchableOpacity>
                  </View>
                </Text>
              </View>
            ))}
            <Pagination
              totalPages={Math.round(branchAdmins?.count! / 10) || 0}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Delete confirmation dialog */}
      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => setShowDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={{ color: '#000' }}>
            Confirm Deletion
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: '#000' }}>
              Are you sure you want to delete this admin? This action cannot be
              undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowDialog(false)}
              labelStyle={{ color: '#000' }}
            >
              Cancel
            </Button>
            <Button
              onPress={handleDeleteAdmin}
              labelStyle={{ color: '#ff0000' }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <AddAdminModal
        branches={branches?.results as Branch[]}
        visible={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
      />
      {admin && (
        <UpdateAdminModal
          branches={branches?.results as Branch[]}
          visible={Boolean(admin)}
          onClose={() => setAdmin(null)}
          admin={admin as any}
        />
      )}
    </ScrollView>
  );
}

const COLUMN_WIDTHS = [1, 1, 1, 1, 1, 1, 1.5];
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EFF4EB',
    padding: 16,
  },
  header: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    fontSize: 18,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#91B275',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 30,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#91B27517',
    flex: 1,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#EFF4EB',
    borderColor: 'transparent',
  },
  dataTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EFF4EB',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#4A4A4A',
    paddingVertical: 10,
  },
  dataTable: {
    minWidth: 700,
  },
  row: {
    flexDirection: 'row',
    minHeight: 55,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#40392B',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dialog: {
    alignSelf: 'center',
    width: SCREEN_WIDTH < 400 ? '95%' : '80%',
    maxWidth: 400,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
});

import { Branch } from '@/types/branchType';
import { useGetBranches } from '@/services/mutation/branchMutation';
import Toast from 'react-native-toast-message';
import Pagination from '@/components/Pagination';
type AddAdminModalProps = {
  branches: Branch[];
  visible: boolean;
  onClose: () => void;
};

function AddAdminModal({ branches, visible, onClose }: AddAdminModalProps) {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [branch, setBranch] = React.useState('');
  const { mutateAsync: addBranchAdmin } = useCreateBranchAdmin();
  const queryClient = useQueryClient();

  const [showMenu, setShowMenu] = React.useState(false);

  const validateForm = () => {
    if (!fullName?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Full name is required.',
      });
      return false;
    }

    if (!email?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Email is required.',
      });
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address.',
      });
      return false;
    }

    if (!phone?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number is required.',
      });
      return false;
    } else if (phone.length < 10 || phone.length > 15) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number must be between 10 and 15 digits.',
      });
      return false;
    }

    if (!branch) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Branch is required.',
      });
      return false;
    }

    return true;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Content style={{ paddingBottom: 10 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <TextInput
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />

            {/* Email */}
            <TextInput
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              style={stylesModal.input}
              keyboardType="email-address"
              placeholderTextColor="#999"
            />

            {/* Phone */}
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              style={stylesModal.input}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />

            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  style={stylesModal.dropdownBtn}
                  labelStyle={{
                    color: branch === '' ? '#aaa' : '#333',
                    fontSize: 14,
                    width: '100%',
                    textAlign: 'left',
                    marginLeft: 0,
                  }}
                  onPress={() => setShowMenu(true)}
                  contentStyle={{
                    flexDirection: 'row-reverse',
                    width: '100%',
                    paddingLeft: 10,
                  }}
                  icon={showMenu ? 'chevron-up' : 'chevron-down'}
                >
                  {branch
                    ? branches.find((b: any) => b.id === branch)?.address
                    : 'Branch'}
                </Button>
              }
              contentStyle={[stylesModal.menuContainer, { width: '100%' }]} // custom menu style
              style={{ alignSelf: 'stretch' }} // Make it align with the anchor width
              anchorPosition="bottom"
            >
              {branches?.length > 0 ? (
                branches?.map((b: any) => (
                  <Menu.Item
                    key={b.id}
                    onPress={() => {
                      setBranch(b.id!);
                      setShowMenu(false);
                    }}
                    title={b.address}
                    titleStyle={stylesModal.menuItem}
                  />
                ))
              ) : (
                <Menu.Item title="No branches available" disabled />
              )}
            </Menu>
          </ScrollView>
        </Dialog.Content>

        {/* Dialog Actions */}
        <Dialog.Actions style={stylesModal.actions}>
          <Button
            mode="contained"
            style={stylesModal.addButton}
            onPress={async () => {
              if (validateForm()) {
                await addBranchAdmin({
                  id: undefined,
                  full_name: fullName,
                  email: email,
                  phone: phone,
                  branch: branch,
                  password: 'Azxvbnhftftftfnj12$',
                  user_type: 'branch',
                });
                queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
                onClose();
              }
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          >
            + Add Admin
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

type UpdateAdminModalProps = {
  admin: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    branch: string;
  };
  branches: Branch[];
  visible: boolean;
  onClose: () => void;
};

function UpdateAdminModal({
  admin,
  branches,
  visible,
  onClose,
}: UpdateAdminModalProps) {
  const [fullName, setFullName] = React.useState(admin.full_name);
  const [email, setEmail] = React.useState(admin.email);
  const [phone, setPhone] = React.useState(admin.phone);
  const [branch, setBranch] = React.useState(admin.branch);
  const { mutateAsync: updateBranchAdmin } = useUpdateBranchAdmin();
  const queryClient = useQueryClient();

  const [showMenu, setShowMenu] = React.useState(false);
  const validateForm = () => {
    if (!fullName?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Full name is required.',
      });
      return false;
    }

    if (!email?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Email is required.',
      });
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address.',
      });
      return false;
    }

    if (!phone?.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number is required.',
      });
      return false;
    } else if (phone.length < 10 || phone.length > 15) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number must be between 10 and 15 digits.',
      });
      return false;
    }

    if (!branch) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Branch is required.',
      });
      return false;
    }

    return true;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Content style={{ paddingBottom: 10 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <TextInput
              placeholder="Full name"
              value={fullName}
              onChangeText={setFullName}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />

            {/* Email */}
            <TextInput
              placeholder="E-mail"
              value={email}
              onChangeText={setEmail}
              style={stylesModal.input}
              keyboardType="email-address"
              placeholderTextColor="#999"
            />

            {/* Phone */}
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              style={stylesModal.input}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />

            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <Button
                  mode="outlined"
                  style={stylesModal.dropdownBtn}
                  labelStyle={{
                    color: branch === '' ? '#aaa' : '#333',
                    fontSize: 14,
                    width: '100%',
                    textAlign: 'left',
                    marginLeft: 0,
                  }}
                  onPress={() => setShowMenu(true)}
                  contentStyle={{
                    flexDirection: 'row-reverse',
                    width: '100%',
                    paddingLeft: 10,
                  }}
                  icon={showMenu ? 'chevron-up' : 'chevron-down'}
                >
                  {branch
                    ? branches.find((b: any) => b.id === branch)?.address
                    : 'Branch'}
                </Button>
              }
              contentStyle={[stylesModal.menuContainer, { width: '100%' }]} // custom menu style
              style={{ alignSelf: 'stretch' }} // Make it align with the anchor width
              anchorPosition="bottom"
            >
              {branches?.length > 0 ? (
                branches?.map((b: any) => (
                  <Menu.Item
                    key={b.id}
                    onPress={() => {
                      setBranch(b.id!);
                      setShowMenu(false);
                    }}
                    title={b.address}
                    titleStyle={stylesModal.menuItem}
                  />
                ))
              ) : (
                <Menu.Item title="No branches available" disabled />
              )}
            </Menu>
          </ScrollView>
        </Dialog.Content>

        {/* Dialog Actions */}
        <Dialog.Actions style={stylesModal.actions}>
          <Button
            mode="contained"
            style={stylesModal.addButton}
            onPress={async () => {
              if (validateForm()) {
                await updateBranchAdmin({
                  id: admin.id,
                  full_name: fullName,
                  email: email,
                  phone: phone,
                  branch: branch,
                });
                queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
                onClose();
              }
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          >
            Update Admin
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: '#f5f9f5',
    width: '50%',
    alignSelf: 'center',
    borderRadius: 12,
  },
  input: {
    backgroundColor: '#e9f1e9',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 15,
    color: '#333',
  },
  dropdownBtn: {
    borderRadius: 6,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    justifyContent: 'flex-start',
    backgroundColor: '#e9f1e9',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 5,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#91B275',
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 5,
  },
  menuItem: {
    color: '#333',
    fontSize: 14,
  },
});
