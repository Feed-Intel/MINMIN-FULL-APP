import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  TextInput,
} from 'react-native';
import { Button, Text, Card, Dialog, Portal, Switch } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import Pencil from '@/assets/icons/Pencil.svg';
import Delete from '@/assets/icons/Delete.svg';
import { Branch } from '@/types/branchType';
import { useGetBranches } from '@/services/mutation/branchMutation';
import {
  useDeleteCoupon,
  useDeleteDiscount,
  useDiscountRules,
  useDiscounts,
  useGetCoupons,
} from '@/services/mutation/discountMutation';
import AddDiscountModal from '@/components/AddDiscount';
import AddCouponModal from '@/components/AddCoupon';
import EditCouponModal from '@/components/EditCoupon';
import EditDiscountModal from '@/components/EditDiscount';
import BranchSelector from '@/components/BranchSelector';
import ModalHeader from '@/components/ModalHeader';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import Pagination from '@/components/Pagination';

const ManageDiscounts: React.FC = () => {
  const { width }: { width: number } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { data: discounts } = useDiscounts(currentPage);
  const { data: coupons } = useGetCoupons(currentPage);
  const { data: branches } = useGetBranches(undefined, true);
  const { data: discountRules = [] } = useDiscountRules();
  const { mutateAsync: discountDelete } = useDeleteDiscount();
  const { mutateAsync: couponDelete } = useDeleteCoupon();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();

  const [showDialog, setShowDialog] = React.useState<boolean>(false);
  const [discount, setDiscount] = React.useState<any | null>(null);
  const [coupon, setCoupon] = React.useState<any | null>(null);
  const [addDiscountModalVisible, setAddDiscountModalVisible] = useState(false);
  const [editDiscountModalVisible, setEditDiscountModalVisible] =
    useState(false);
  const [addCouponModalVisible, setAddCouponModalVisible] = useState(false);
  const [editCouponModalVisible, setEditCouponModalVisible] = useState(false);
  const [selectedDiscountRule, setSelectedDiscountRule] = useState<any | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState('Discount');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    isBranch ? branchId ?? null : null
  );
  const isSmallScreen: boolean = width < 768;

  const filterByBranch = <T extends { branch?: any }>(items: T[]): T[] => {
    if (!selectedBranch || selectedBranch === 'all') return items;

    return items.filter((item) => {
      const branchValue =
        typeof item.branch === 'object' ? item.branch?.id : item.branch;
      return branchValue === selectedBranch;
    });
  };
  const filteredDiscounts = useMemo(
    () =>
      filterByBranch(discounts?.results as any) as unknown as typeof discounts,
    [discounts, selectedBranch]
  );

  const filteredCoupons = useMemo(
    () => filterByBranch(coupons as any) as unknown as typeof coupons,
    [coupons, selectedBranch]
  );

  const handleDeleteDiscount = async (): Promise<void> => {
    setShowDialog(false);
    dispatch(showLoader());
    try {
      if (discount.id) {
        await discountDelete(discount.id!);
        queryClient.invalidateQueries({ queryKey: ['discounts'] });
      }
    } catch (error) {
      console.error('Error deleting discount:', error);
    } finally {
      dispatch(hideLoader());
      setDiscount(null);
    }
  };

  const handleDeleteCoupon = async (): Promise<void> => {
    setShowDialog(false);
    dispatch(showLoader());
    try {
      if (coupon.id) {
        await couponDelete(coupon.id!);
        queryClient.invalidateQueries({ queryKey: ['coupons'] });
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    } finally {
      dispatch(hideLoader());
      setCoupon(null);
    }
  };

  return (
    <View style={rootStyles.container}>
      <ScrollView style={styles.container}>
        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <View style={styles.headerRow}>
              <Text variant="titleLarge" style={styles.title}>
                Discount and Coupon
              </Text>
            </View>
            <BranchSelector
              selectedBranch={selectedBranch}
              onChange={setSelectedBranch}
              includeAllOption={isRestaurant}
            />

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
              <TextInput
                placeholder="Search by Item name or Catagory"
                style={styles.searchBar}
                placeholderTextColor="#999"
              />
              <Button
                mode="contained"
                onPress={() => {
                  if (selectedCategory === 'Coupons') {
                    setAddCouponModalVisible(true);
                  } else {
                    setAddDiscountModalVisible(true);
                  }
                }}
                style={styles.addButton}
                labelStyle={{ fontSize: 14, color: '#fff' }}
              >
                {selectedCategory === 'Coupons'
                  ? '+ Add Coupon'
                  : '+ Add Discount'}
              </Button>
            </View>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedCategory === 'Discount' && styles.activeTabButton,
                ]}
                onPress={() => setSelectedCategory('Discount')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedCategory === 'Discount' && styles.activeTabText,
                  ]}
                >
                  Discount
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedCategory === 'Coupons' && styles.activeTabButton,
                ]}
                onPress={() => setSelectedCategory('Coupons')}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedCategory === 'Coupons' && styles.activeTabText,
                  ]}
                >
                  Coupons
                </Text>
              </TouchableOpacity>
            </View>

            {/* Table */}

            <ScrollView horizontal={isSmallScreen}>
              {selectedCategory === 'Discount' && (
                <View style={styles.dataTable}>
                  <View style={styles.dataTableHeader}>
                    {[
                      'Name',
                      'Branch',
                      'Type',
                      'Priority',
                      'Discount Rules',
                      'Actions',
                    ].map((title, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.headerCell,
                          {
                            flex: index == 0 ? 0.5 : COLUMN_WIDTHS[index],
                            textAlign: 'center',
                            // position: "relative",
                            // left: index === 0 ? 20 : 0,
                          },
                        ]}
                      >
                        {title}
                      </Text>
                    ))}
                  </View>

                  {filteredDiscounts?.map((disc: any) => {
                    const relatedRule = discountRules.find(
                      (rule: any) => rule.discount_id.id === disc.id
                    );

                    const ruleSummary = (() => {
                      if (!relatedRule) {
                        return 'No rule configured';
                      }

                      switch (disc.type) {
                        case 'volume':
                          return `Min items ≥ ${relatedRule.min_items ?? 0}`;
                        case 'combo':
                          return relatedRule.combo_size
                            ? `Combo size ${relatedRule.combo_size}`
                            : 'Combo rule configured';
                        case 'bogo':
                        case 'freeItem':
                          return relatedRule.buy_quantity &&
                            relatedRule.get_quantity
                            ? `Buy ${relatedRule.buy_quantity} • Get ${relatedRule.get_quantity}`
                            : 'Benefit rule configured';
                        default:
                          return 'Rule configured';
                      }
                    })();

                    return (
                      <View key={disc.id} style={styles.row}>
                        <Text
                          style={[
                            styles.cell,
                            {
                              flex: 0.5,
                              textAlign: 'center',
                            },
                          ]}
                        >
                          {disc.name}
                        </Text>

                        <Text style={[styles.cell, { flex: COLUMN_WIDTHS[1] }]}>
                          {[disc.tenant?.restaurant_name, disc.branch?.address]
                            .filter(Boolean)
                            .join(', ')}
                        </Text>

                        <Text style={[styles.cell, { flex: COLUMN_WIDTHS[2] }]}>
                          {disc.type}
                        </Text>

                        <Text style={[styles.cell, { flex: COLUMN_WIDTHS[3] }]}>
                          {disc.priority}
                        </Text>

                        <Text style={[styles.cell, { flex: COLUMN_WIDTHS[4] }]}>
                          {ruleSummary}
                        </Text>

                        <Text style={[styles.cell, { flex: COLUMN_WIDTHS[5] }]}>
                          <View style={styles.actionContainer}>
                            <Switch
                              value={Boolean(disc?.is_active ?? true)}
                              color="#91B275"
                            />
                            <TouchableOpacity
                              onPress={() => {
                                setDiscount(disc);
                                setSelectedDiscountRule(relatedRule ?? null);
                                setEditDiscountModalVisible(true);
                              }}
                            >
                              <Pencil height={40} width={40} color="#91B275" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                setDiscount(disc);
                                setShowDialog(true);
                              }}
                            >
                              <Delete height={40} width={40} color="#91B275" />
                            </TouchableOpacity>
                          </View>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {selectedCategory === 'Coupons' && (
                <View style={styles.dataTable}>
                  <View style={styles.dataTableHeader}>
                    {['Code', 'Created', 'Updated', 'Actions'].map(
                      (title, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.headerCell,
                            {
                              flex: index === 0 ? 0.5 : 1,
                              textAlign: 'center',
                              // position: "relative",
                              // left: index === 0 ? 20 : 0,
                            },
                          ]}
                        >
                          {title}
                        </Text>
                      )
                    )}
                  </View>

                  {filteredCoupons?.results.map((cp: any) => (
                    <View key={cp.id} style={styles.row}>
                      {/* Branch */}
                      <Text
                        style={[
                          styles.cell,
                          {
                            flex: 0.5,
                            textAlign: 'center',
                          },
                        ]}
                      >
                        {cp.discount_code}
                      </Text>

                      <Text style={[styles.cell, { flex: 1 }]}>
                        {cp.created_at}
                      </Text>

                      <Text style={[styles.cell, { flex: 1 }]}>
                        {cp.updated_at}
                      </Text>

                      {/* Actions */}
                      <Text style={[styles.cell, { flex: 1 }]}>
                        <View style={styles.actionContainer}>
                          <Switch
                            value={cp.is_valid}
                            // onValueChange={
                            // }
                            color="#91B275"
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setCoupon(cp);
                              setEditCouponModalVisible(true);
                            }}
                          >
                            <Pencil height={40} width={40} color="#91B275" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setCoupon(cp);
                              setShowDialog(true);
                            }}
                          >
                            <Delete height={40} width={40} color="#91B275" />
                          </TouchableOpacity>
                        </View>
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <Pagination
                totalPages={
                  Math.round(
                    selectedCategory == 'Coupons'
                      ? coupons?.count! / 10
                      : discounts?.count! / 10
                  ) || 0
                }
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </ScrollView>

            {/* Delete Dialog */}
            <Portal>
              <Dialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                style={[styles.dialog, { width: '50%', alignSelf: 'center' }]}
              >
                <Dialog.Title>
                  <ModalHeader
                    title="Confirm Deletion"
                    onClose={() => setShowDialog(false)}
                  />
                </Dialog.Title>
                <Dialog.Content>
                  <Text style={{ color: '#000' }}>
                    Are you sure you want to delete this{' '}
                    {selectedCategory === 'Coupons' ? 'Coupon' : 'Discount'}?
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
                    onPress={
                      selectedCategory === 'Coupons'
                        ? handleDeleteCoupon
                        : handleDeleteDiscount
                    }
                    labelStyle={{ color: '#ff0000' }}
                  >
                    Delete
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Card.Content>
        </Card>
      </ScrollView>
      <AddDiscountModal
        branches={(branches?.results as Branch[]) || []}
        visible={addDiscountModalVisible}
        currentPage={currentPage}
        onClose={() => setAddDiscountModalVisible(false)}
      />
      {discount && (
        <EditDiscountModal
          branches={branches?.results || []}
          discount={discount}
          discountRule={selectedDiscountRule}
          visible={editDiscountModalVisible}
          currentPage={currentPage}
          onClose={() => {
            setEditDiscountModalVisible(false);
            setDiscount(null);
            setSelectedDiscountRule(null);
          }}
        />
      )}
      <AddCouponModal
        visible={addCouponModalVisible}
        branches={branches?.results || []}
        setVisible={setAddCouponModalVisible}
      />
      {coupon && (
        <EditCouponModal
          visible={editCouponModalVisible}
          branches={branches?.results || []}
          onClose={() => {
            setEditCouponModalVisible(false);
            setCoupon(null);
          }}
          coupon={coupon as any}
        />
      )}
    </View>
  );
};

const COLUMN_WIDTHS = [1, 1.2, 1, 0.8, 1.5, 1.2];

const rootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4EB',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#EFF4EB',
    borderColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '600',
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
    marginBottom: 20,
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
  dataTable: {
    minWidth: 700,
  },
  tabContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 10,
    padding: 3,
  },
  tabButton: {
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 125,
    borderBottomWidth: 2,
    borderColor: '#ccc',
  },
  activeTabButton: {
    borderBottomColor: '#668442',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#668442',
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
  row: {
    flexDirection: 'row',
    minHeight: 55,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#40392B',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignSelf: 'center',
  },
  dropdownBtn: {
    backgroundColor: '#91B27517',
    borderRadius: 6,
    minWidth: 60,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6483490F',
  },
  qrCodeImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignSelf: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 130,
    alignSelf: 'center',
  },
  dialog: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
});

export default ManageDiscounts;
