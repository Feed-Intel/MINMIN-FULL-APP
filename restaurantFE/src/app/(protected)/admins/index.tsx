import React, { useEffect, useState } from 'react';
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
  HelperText,
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
import { i18n as I18n } from '@/app/_layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BranchAdmins() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data: branchAdmins } = useGetBranchAdmins(currentPage);
  const [isAdminActive, setIsAdminActive] = useState<Record<string, boolean>>(
    {}
  );
  const { mutate: adminDelete } = useDeleteBranchAdmin();
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = React.useState(false);
  const [adminID, setAdminID] = React.useState<string | null>(null);
  const [showAddAdminModal, setShowAddAdminModal] = React.useState(false);
  const { data: branches } = useGetBranches();
  const [admin, setAdmin] = useState<{} | null>(null);

  const { mutate: editBranchAdmin, isPending: isUpdating } =
    useUpdateBranchAdmin();

  const handleDeleteAdmin = async () => {
    try {
      setShowDialog(false);
      dispatch(showLoader());
      adminDelete(adminID!);
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      dispatch(hideLoader());
      setAdminID(null);
    } catch (error) {
      setShowDialog(false);
    }
  };

  const updateBranchAdmin = async (admin: any, value: boolean) => {
    try {
      dispatch(showLoader());
      editBranchAdmin({
        ...admin,
        branch: (typeof admin.branch === 'object'
          ? admin.branch.id
          : admin.branch) as any,
        is_active: value,
      });
      queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
      setIsAdminActive((prev) => ({
        ...prev,
        [admin.id!]: value,
      }));
      dispatch(hideLoader());
    } catch (error) {
      console.error('Error updating branch admin:', error);
    }
  };

  useEffect(() => {
    if (branchAdmins) {
      setIsAdminActive(
        branchAdmins.results.reduce((acc, admin) => {
          acc[admin.id!] = admin.is_active!;
          return acc;
        }, {} as Record<string, boolean>)
      );
    }
  }, [branchAdmins]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}{' '}
      <View style={styles.header}>
        {' '}
        <Text style={styles.title}>
          {I18n.t('BranchAdmins.header_title')}
        </Text>{' '}
      </View>
      {/* Search bar */}{' '}
      <View style={styles.searchBarContainer}>
        {' '}
        <TextInput
          placeholder={I18n.t('BranchAdmins.search_placeholder')}
          style={styles.searchBar}
          placeholderTextColor="#999"
        />{' '}
        <Button
          mode="contained"
          onPress={() => setShowAddAdminModal(true)}
          style={styles.addButton}
          labelStyle={{ fontSize: 14, color: '#fff' }}
        >
          {I18n.t('BranchAdmins.add_button')}{' '}
        </Button>{' '}
      </View>
      {/* Table */}{' '}
      <Card style={styles.card} mode="outlined">
        {' '}
        <Card.Content style={{ paddingHorizontal: 0 }}>
          {/* Removed ScrollView horizontal wrapper */}{' '}
          <View style={styles.dataTable}>
            {' '}
            <View style={styles.dataTableHeader}>
              {' '}
              {[
                I18n.t('BranchAdmins.table_header_fullname'),
                I18n.t('BranchAdmins.table_header_email'),
                I18n.t('BranchAdmins.table_header_phone'),
                I18n.t('BranchAdmins.table_header_branch'),
                I18n.t('BranchAdmins.table_header_actions'),
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
                  {title}{' '}
                </Text>
              ))}{' '}
            </View>{' '}
            {branchAdmins?.results.map((admin) => (
              <View key={admin.id} style={styles.row}>
                {' '}
                <Text
                  style={[
                    styles.cell,
                    { textAlign: 'left', position: 'relative', left: 20 },
                  ]}
                >
                  {admin.full_name}{' '}
                </Text>
                <Text style={styles.cell}>{admin.email}</Text>
                <Text style={styles.cell}>{admin.phone}</Text>{' '}
                <Text style={styles.cell}>
                  {' '}
                  {typeof admin.branch === 'string'
                    ? admin.branch
                    : admin.branch.address}{' '}
                </Text>{' '}
                <Text style={styles.cell}>
                  {' '}
                  <View style={styles.actionContainer}>
                    {' '}
                    <Switch
                      value={isAdminActive[admin.id!] || false}
                      onValueChange={(val) => {
                        updateBranchAdmin(admin, val);
                      }}
                      color="#91B275"
                    />{' '}
                    <TouchableOpacity
                      onPress={() =>
                        setAdmin({
                          id: admin.id,
                          full_name: admin.full_name,
                          email: admin.email,
                          phone: admin.phone,
                          branch: (admin.branch as any).id,
                          is_active: admin.is_active,
                        })
                      }
                    >
                      {' '}
                      <Pencil height={40} width={40} color="#91B275" />{' '}
                    </TouchableOpacity>{' '}
                    <TouchableOpacity
                      onPress={() => {
                        setAdminID(admin.id!);
                        setShowDialog(true);
                      }}
                    >
                      {' '}
                      <Delete height={40} width={40} color="#91B275" />{' '}
                    </TouchableOpacity>{' '}
                  </View>{' '}
                </Text>{' '}
              </View>
            ))}{' '}
            <Pagination
              totalPages={Math.round(branchAdmins?.count! / 10) || 0}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />{' '}
          </View>{' '}
        </Card.Content>{' '}
      </Card>
      {/* Delete confirmation dialog */}{' '}
      <Portal>
        {' '}
        <Dialog
          visible={showDialog}
          onDismiss={() => setShowDialog(false)}
          style={styles.dialog}
        >
          {' '}
          <Dialog.Title style={{ color: '#000' }}>
            {I18n.t('BranchAdmins.delete_dialog_title')}{' '}
          </Dialog.Title>{' '}
          <Dialog.Content>
            {' '}
            <Text style={{ color: '#000' }}>
              {I18n.t('BranchAdmins.delete_dialog_message')}{' '}
            </Text>{' '}
          </Dialog.Content>{' '}
          <Dialog.Actions>
            {' '}
            <Button
              onPress={() => setShowDialog(false)}
              labelStyle={{ color: '#000' }}
            >
              {I18n.t('BranchAdmins.cancel_button')}{' '}
            </Button>{' '}
            <Button
              onPress={handleDeleteAdmin}
              labelStyle={{ color: '#ff0000' }}
            >
              {I18n.t('BranchAdmins.delete_button')}{' '}
            </Button>{' '}
          </Dialog.Actions>{' '}
        </Dialog>{' '}
      </Portal>{' '}
      <AddAdminModal
        branches={branches?.results as Branch[]}
        visible={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
      />{' '}
      {admin && (
        <UpdateAdminModal
          branches={branches?.results as Branch[]}
          visible={Boolean(admin)}
          onClose={() => setAdmin(null)}
          admin={admin as any}
        />
      )}{' '}
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
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const { mutate: addBranchAdmin } = useCreateBranchAdmin();
  const queryClient = useQueryClient();

  const [showMenu, setShowMenu] = React.useState(false);

  const validateForm = () => {
    let hasError: boolean = false;
    if (!fullName?.trim() || fullName?.trim().length < 3) {
      setErrors((prev: any) => ({
        ...prev,
        full_name: I18n.t('AddAdmin.error_fullname_required'),
      }));
      hasError = true;
    }

    if (!email?.trim()) {
      setErrors((prev: any) => ({
        ...prev,
        email: I18n.t('AddAdmin.error_email_required'),
      }));
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors((prev: any) => ({
        ...prev,
        email: I18n.t('AddAdmin.error_email_invalid'),
      }));
      hasError = true;
    }

    if (!phone?.trim()) {
      setErrors((prev: any) => ({
        ...prev,
        phone: I18n.t('AddAdmin.error_phone_required'),
      }));
      hasError = true;
    } else if (
      (phone.length != 10 && phone.length != 12) ||
      (!phone.startsWith('09') && !phone.startsWith('251'))
    ) {
      setErrors((prev: any) => ({
        ...prev,
        phone: I18n.t('AddAdmin.error_phone_length'),
      }));
      hasError = true;
    }

    if (!branch) {
      setErrors((prev: any) => ({
        ...prev,
        branch: I18n.t('AddAdmin.error_branch_required'),
      }));
      hasError = true;
    }

    if (hasError) return false;

    return true;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        {/* Localized Dialog Title */}
        <Dialog.Title>{I18n.t('AddAdmin.modal_title')}</Dialog.Title>
        <Dialog.Content style={{ paddingBottom: 10 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <TextInput
              placeholder={I18n.t('AddAdmin.input_placeholder_fullname')}
              value={fullName}
              onChangeText={(text: string) => {
                setFullName(text);
                setErrors((prev: any) => ({ ...prev, full_name: undefined }));
              }}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />
            {errors.full_name && (
              <HelperText type="error" visible={!!errors.full_name}>
                {errors.full_name}{' '}
              </HelperText>
            )}

            {/* Email */}
            <TextInput
              placeholder={I18n.t('AddAdmin.input_placeholder_email')}
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                setErrors((prev: any) => ({ ...prev, email: undefined }));
              }}
              style={stylesModal.input}
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}{' '}
              </HelperText>
            )}
            {/* Phone */}
            <TextInput
              placeholder={I18n.t('AddAdmin.input_placeholder_phone')}
              value={phone}
              onChangeText={(text: string) => {
                setPhone(text);
                setErrors((prev: any) => ({ ...prev, phone: undefined }));
              }}
              style={stylesModal.input}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            {errors.phone && (
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}{' '}
              </HelperText>
            )}
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
                    : I18n.t('AddAdmin.dropdown_placeholder_branch')}
                </Button>
              }
              contentStyle={[stylesModal.menuContainer, { width: '100%' }]}
              style={{ alignSelf: 'stretch' }}
              anchorPosition="bottom"
            >
              {branches?.length > 0 ? (
                branches?.map((b: any) => (
                  <Menu.Item
                    key={b.id}
                    onPress={() => {
                      setBranch(b.id!);
                      setShowMenu(false);
                      setErrors((prev: any) => ({
                        ...prev,
                        branch: undefined,
                      }));
                    }}
                    title={b.address}
                    titleStyle={stylesModal.menuItem}
                  />
                ))
              ) : (
                <Menu.Item
                  title={I18n.t('Common.no_branches_available')}
                  disabled
                />
              )}
            </Menu>
            {errors.branch && (
              <HelperText type="error" visible={!!errors.branch}>
                {errors.branch}{' '}
              </HelperText>
            )}
          </ScrollView>
        </Dialog.Content>

        {/* Dialog Actions */}
        <Dialog.Actions style={stylesModal.actions}>
          {/* Localized Cancel Button */}
          <Button
            mode="outlined"
            onPress={onClose}
            style={stylesModal.cancelButton}
            labelStyle={{ fontWeight: 'bold' }}
          >
            {I18n.t('BranchAdmins.cancel_button')}
          </Button>
          {/* Localized Add Admin Button */}
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
                // Show success toast
                Toast.show({
                  type: 'success',
                  text1: I18n.t('AddAdmin.snackbar_success'),
                });
                onClose();
              }
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          >
            {I18n.t('AddAdmin.button_add_admin')}
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
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>(
    {}
  );
  // Assume useUpdateBranchAdmin and useQueryClient are defined externally
  const { mutate: updateBranchAdmin } = useUpdateBranchAdmin();
  const queryClient = useQueryClient();

  const [showMenu, setShowMenu] = React.useState(false);

  const validateForm = () => {
    let hasError: boolean = false;
    if (!fullName?.trim() || fullName?.trim().length < 3) {
      setErrors((prev) => ({
        ...prev,
        full_name: I18n.t('EditAdmin.error_fullname_required'),
      }));
      hasError = true;
    }

    // Check Email
    if (!email?.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: I18n.t('EditAdmin.error_email_required'),
      }));
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors((prev) => ({
        ...prev,
        email: I18n.t('EditAdmin.error_email_invalid'),
      }));
      hasError = true;
    }

    // Check Phone
    if (!phone?.trim()) {
      setErrors((prev) => ({
        ...prev,
        phone: I18n.t('EditAdmin.error_phone_length'),
      }));
      hasError = true;
    } else if (
      (phone.length != 10 && phone.length != 12) ||
      (!phone.startsWith('09') && !phone.startsWith('251'))
    ) {
      setErrors((prev) => ({
        ...prev,
        phone: I18n.t('AddAdmin.error_phone_length'),
      }));
      hasError = true;
    }

    // Check Branch
    if (!branch) {
      setErrors((prev) => ({
        ...prev,
        branch: I18n.t('EditAdmin.error_branch_required'),
      }));
      hasError = true;
    }

    return !hasError;
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        {/* Localized Dialog Title */}
        <Dialog.Title>{I18n.t('EditAdmin.screen_title')}</Dialog.Title>
        <Dialog.Content style={{ paddingBottom: 10 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Full Name Input */}
            <TextInput
              placeholder={I18n.t('EditAdmin.label_fullname')}
              value={fullName}
              onChangeText={(text: string) => {
                const cleaned = text.replace(/[0-9]/g, '');
                setFullName(cleaned);
                setErrors((prev) => ({ ...prev, full_name: undefined }));
              }}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />
            {errors.full_name && (
              <HelperText type="error" visible={!!errors.full_name}>
                {errors.full_name}{' '}
              </HelperText>
            )}
            {/* Email Input */}
            <TextInput
              placeholder={I18n.t('EditAdmin.label_email')}
              value={email}
              onChangeText={(text: string) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              style={stylesModal.input}
              keyboardType="email-address"
              placeholderTextColor="#999"
            />
            {errors.email && (
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}{' '}
              </HelperText>
            )}
            {/* Phone Input */}
            <TextInput
              placeholder={I18n.t('EditAdmin.label_phone')}
              value={phone}
              onChangeText={(text: string) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setPhone(cleaned);
                setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              style={stylesModal.input}
              keyboardType="phone-pad"
              placeholderTextColor="#999"
            />
            {errors.phone && (
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}{' '}
              </HelperText>
            )}
            {/* Branch Dropdown Menu */}
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
                    : I18n.t('EditAdmin.placeholder_branch')}
                </Button>
              }
              contentStyle={[stylesModal.menuContainer, { width: '100%' }]}
              style={{ alignSelf: 'stretch' }}
              anchorPosition="bottom"
            >
              {branches?.length > 0 ? (
                branches?.map((b: any) => (
                  <Menu.Item
                    key={b.id}
                    onPress={() => {
                      setBranch(b.id!);
                      setShowMenu(false);
                      setErrors((prev) => ({ ...prev, branch: undefined }));
                    }}
                    title={b.address}
                    titleStyle={stylesModal.menuItem}
                  />
                ))
              ) : (
                <Menu.Item
                  title={I18n.t('Common.no_branches_available')}
                  disabled
                />
              )}
            </Menu>
            {errors.branch && (
              <HelperText type="error" visible={!!errors.branch}>
                {errors.branch}{' '}
              </HelperText>
            )}
          </ScrollView>
        </Dialog.Content>

        {/* Dialog Actions */}
        <Dialog.Actions style={stylesModal.actions}>
          {/* Cancel Button */}
          <Button
            mode="outlined"
            onPress={onClose}
            style={stylesModal.cancelButton}
            labelStyle={{ fontWeight: 'bold' }}
          >
            {I18n.t('BranchAdmins.cancel_button')}
          </Button>
          {/* Save Changes Button */}
          <Button
            mode="contained"
            style={stylesModal.addButton}
            onPress={async () => {
              if (validateForm()) {
                updateBranchAdmin({
                  id: admin.id,
                  full_name: fullName,
                  email: email,
                  phone: phone,
                  branch: branch,
                });
                queryClient.invalidateQueries({ queryKey: ['branchAdmins'] });
                // Show success toast
                Toast.show({
                  type: 'success',
                  text1: I18n.t('EditAdmin.snackbar_success'),
                });
                onClose();
              }
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
          >
            {I18n.t('EditAdmin.button_save_changes')}
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
  cancelButton: {
    borderRadius: 30,
    paddingHorizontal: 25,
    paddingVertical: 5,
  },
});
