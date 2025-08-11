import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  TextInput,
} from "react-native";
import { Button, Text, Card, Dialog, Portal, Switch } from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { hideLoader, showLoader } from "@/lib/reduxStore/loaderSlice";
import Pencil from "@/assets/icons/Pencil.svg";
import Delete from "@/assets/icons/Delete.svg";
import { Branch } from "@/types/branchType";
import { useGetBranches } from "@/services/mutation/branchMutation";
import {
  useDeleteCoupon,
  useDeleteDiscount,
  useDiscountRules,
  useDiscounts,
  useGetCoupons,
} from "@/services/mutation/discountMutation";
import AddDiscountModal from "@/components/AddDiscount";
import AddDiscountRuleModal from "@/components/AddRuleModal";
import AddCouponModal from "@/components/AddCoupon";
import EditCouponModal from "@/components/EditCoupon";
import EditDiscountModal from "@/components/EditDiscount";
import EditDiscountRuleModal from "@/components/EditRuleModal";
import { set } from "react-hook-form";

const ManageDiscounts: React.FC = () => {
  const { width }: { width: number } = useWindowDimensions();
  const { data: discounts = [] } = useDiscounts();
  const { data: coupons = [] } = useGetCoupons();
  const { data: branches = [] } = useGetBranches();
  const { data: discountRules = [] } = useDiscountRules();
  const { mutateAsync: discountDelete } = useDeleteDiscount();
  const { mutateAsync: couponDelete } = useDeleteCoupon();
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const [showDialog, setShowDialog] = React.useState<boolean>(false);
  const [discount, setDiscount] = React.useState<any | null>(null);
  const [coupon, setCoupon] = React.useState<any | null>(null);
  const [addDiscountModalVisible, setAddDiscountModalVisible] = useState(false);
  const [editDiscountModalVisible, setEditDiscountModalVisible] =
    useState(false);
  const [addCouponModalVisible, setAddCouponModalVisible] = useState(false);
  const [editCouponModalVisible, setEditCouponModalVisible] = useState(false);
  const [discountRule, setDiscountRule] = useState<any | null>(null);
  const [showDiscountRule, setShowDiscountRule] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Discount");
  const isSmallScreen: boolean = width < 768;

  const handleDeleteDiscount = async (): Promise<void> => {
    setShowDialog(false);
    dispatch(showLoader());
    try {
      if (discount.id) {
        await discountDelete(discount.id!);
        queryClient.invalidateQueries({ queryKey: ["discounts"] });
      }
    } catch (error) {
      console.error("Error deleting discount:", error);
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
        queryClient.invalidateQueries({ queryKey: ["coupons"] });
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
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
                  if (selectedCategory === "Coupons") {
                    setAddCouponModalVisible(true);
                  } else {
                    setAddDiscountModalVisible(true);
                  }
                }}
                style={styles.addButton}
                labelStyle={{ fontSize: 14, color: "#fff" }}
              >
                {selectedCategory === "Coupons"
                  ? "+ Add Coupon"
                  : "+ Add Discount"}
              </Button>
            </View>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedCategory === "Discount" && styles.activeTabButton,
                ]}
                onPress={() => setSelectedCategory("Discount")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedCategory === "Discount" && styles.activeTabText,
                  ]}
                >
                  Discount
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  selectedCategory === "Coupons" && styles.activeTabButton,
                ]}
                onPress={() => setSelectedCategory("Coupons")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedCategory === "Coupons" && styles.activeTabText,
                  ]}
                >
                  Coupons
                </Text>
              </TouchableOpacity>
            </View>

            {/* Table */}

            <ScrollView horizontal={isSmallScreen}>
              {selectedCategory === "Discount" && (
                <View style={styles.dataTable}>
                  <View style={styles.dataTableHeader}>
                    {[
                      "Name",
                      "Branch",
                      "Type",
                      "Priority",
                      "Discount Rules",
                      "Actions",
                    ].map((title, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.headerCell,
                          {
                            flex: index == 0 ? 0.5 : COLUMN_WIDTHS[index],
                            textAlign: "center",
                            // position: "relative",
                            // left: index === 0 ? 20 : 0,
                          },
                        ]}
                      >
                        {title}
                      </Text>
                    ))}
                  </View>

                  {discounts.map((disc: any) => (
                    <View key={disc.id} style={styles.row}>
                      {/* Branch */}
                      <Text
                        style={[
                          styles.cell,
                          {
                            flex: 0.5,
                            textAlign: "center",
                          },
                        ]}
                      >
                        {disc.name}
                      </Text>

                      <Text style={[styles.cell, { flex: COLUMN_WIDTHS[1] }]}>
                        {disc.tenant.restaurant_name +
                          ", " +
                          disc.branch.address}
                      </Text>

                      {/* Delivery table */}
                      <Text style={[styles.cell, { flex: COLUMN_WIDTHS[2] }]}>
                        {disc.type}
                      </Text>

                      {/* Inside table */}
                      <Text style={[styles.cell, { flex: COLUMN_WIDTHS[3] }]}>
                        {disc.priority}
                      </Text>

                      <Text style={[styles.cell, { flex: COLUMN_WIDTHS[4] }]}>
                        <Button
                          mode="outlined"
                          onPress={() => {
                            const dsr = discountRules.find(
                              (dsr: any) => dsr.discount_id.id == disc.id
                            );
                            if (dsr?.id) {
                              setDiscountRule(dsr);
                            } else {
                              setDiscount(disc);
                              setShowDiscountRule(true);
                            }
                          }}
                          style={{ borderColor: "#6E504933" }}
                          labelStyle={{ color: "#281D1B" }}
                        >
                          {discountRules.find(
                            (dsr: any) => dsr.discount_id.id == disc.id
                          )
                            ? "Update Rule"
                            : "+ Add Rule"}
                        </Button>
                      </Text>

                      {/* Actions */}
                      <Text style={[styles.cell, { flex: COLUMN_WIDTHS[5] }]}>
                        <View style={styles.actionContainer}>
                          <Switch
                            value={true}
                            // onValueChange={
                            // }
                            color="#91B275"
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setDiscount(disc);
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
                  ))}
                </View>
              )}

              {selectedCategory === "Coupons" && (
                <View style={styles.dataTable}>
                  <View style={styles.dataTableHeader}>
                    {["Code", "Created", "Updated", "Actions"].map(
                      (title, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.headerCell,
                            {
                              flex: index === 0 ? 0.5 : 1,
                              textAlign: "center",
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

                  {coupons.map((cp: any) => (
                    <View key={cp.id} style={styles.row}>
                      {/* Branch */}
                      <Text
                        style={[
                          styles.cell,
                          {
                            flex: 0.5,
                            textAlign: "center",
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
            </ScrollView>

            {/* Delete Dialog */}
            <Portal>
              <Dialog
                visible={showDialog}
                onDismiss={() => setShowDialog(false)}
                style={[styles.dialog, { width: "50%", alignSelf: "center" }]}
              >
                <Dialog.Title style={{ color: "#000" }}>
                  Confirm Deletion
                </Dialog.Title>
                <Dialog.Content>
                  <Text style={{ color: "#000" }}>
                    Are you sure you want to delete this{" "}
                    {selectedCategory === "Coupons" ? "Coupon" : "Discount"}?
                  </Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button
                    onPress={() => setShowDialog(false)}
                    labelStyle={{ color: "#000" }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={
                      selectedCategory === "Coupons"
                        ? handleDeleteCoupon
                        : handleDeleteDiscount
                    }
                    labelStyle={{ color: "#ff0000" }}
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
        branches={branches as Branch[]}
        visible={addDiscountModalVisible}
        onClose={() => setAddDiscountModalVisible(false)}
      />
      {discount && (
        <EditDiscountModal
          branches={branches}
          discount={discount}
          visible={editDiscountModalVisible}
          onClose={() => setEditDiscountModalVisible(false)}
        />
      )}
      <AddCouponModal
        visible={addCouponModalVisible}
        setVisible={setAddCouponModalVisible}
      />
      {coupon && (
        <EditCouponModal
          visible={editCouponModalVisible}
          onClose={() => {
            setEditCouponModalVisible(false);
            setCoupon(null);
          }}
          coupon={coupon as any}
        />
      )}
      {discount && (
        <AddDiscountRuleModal
          discount={discount}
          visible={showDiscountRule}
          setVisible={setShowDiscountRule}
        />
      )}
      {discountRule && (
        <EditDiscountRuleModal
          discountRule={discountRule}
          visible={Boolean(discountRule)}
          setVisible={setDiscountRule}
        />
      )}
    </View>
  );
};

const COLUMN_WIDTHS = [1, 1, 1, 1, 1, 1, 1.5];

const rootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF4EB",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#EFF4EB",
    borderColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 30,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#91B27517",
    flex: 1,
  },
  dataTable: {
    minWidth: 700,
  },
  tabContainer: {
    flexDirection: "row",
    overflow: "hidden",
    marginTop: 10,
    padding: 3,
  },
  tabButton: {
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 125,
    borderBottomWidth: 2,
    borderColor: "#ccc",
  },
  activeTabButton: {
    borderBottomColor: "#668442",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  activeTabText: {
    color: "#668442",
  },
  dataTableHeader: {
    flexDirection: "row",
    backgroundColor: "#EFF4EB",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#4A4A4A",
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    minHeight: 55,
  },
  cell: {
    flex: 1,
    textAlign: "center",
    color: "#40392B",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignSelf: "center",
  },
  dropdownBtn: {
    backgroundColor: "#91B27517",
    borderRadius: 6,
    minWidth: 60,
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#6483490F",
  },
  qrCodeImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignSelf: "center",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 130,
    alignSelf: "center",
  },
  dialog: {
    borderRadius: 12,
    backgroundColor: "#fff",
  },
});

export default ManageDiscounts;
