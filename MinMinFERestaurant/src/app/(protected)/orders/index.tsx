import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  TextInput,
  Text,
  Button,
  DataTable,
  Chip,
  Snackbar,
  ActivityIndicator,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { useOrders, useUpdateOrder } from "@/services/mutation/orderMutation";
import { Order } from "@/types/orderTypes";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { resetPendingOrders } from "@/lib/reduxStore/orderSlice";
import { OrderModal } from "./addOrder";
export default function Orders() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [filterText, setFilterText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useOrders();
  const updateOrderStatus = useUpdateOrder();
  const dispatch = useDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  // Status groups for top filters
  const statusGroups = {
    Access: ["placed"],
    Processed: ["progress", "delivered"],
    Riskers: ["cancelled"],
  };
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Status labels for tabs
  const statusLabels = {
    All: "All",
    placed: "Placed",
    progress: "In Progress",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  // Screen size breakpoints
  const isSmallScreen = width < 768;
  const isMediumScreen = width >= 768 && width < 1024;
  const isLargeScreen = width >= 1024;

  useEffect(() => {
    dispatch(resetPendingOrders());
  }, []);

  useEffect(() => {
    if (orders) {
      let filteredData = orders.filter((order) => {
        const customerName =
          typeof order.customer === "string"
            ? order.customer
            : order.customer?.full_name?.toLowerCase() || "";
        const branchAddress =
          typeof order.branch === "string"
            ? order.branch
            : order.branch?.address?.toLowerCase() || "";
        return (
          customerName.includes(filterText.toLowerCase()) ||
          branchAddress.includes(filterText.toLowerCase())
        );
      });

      // Apply group filter if selected
      if (selectedGroup) {
        const groupStatuses =
          statusGroups[selectedGroup as keyof typeof statusGroups];
        filteredData = filteredData.filter((order) =>
          groupStatuses.includes(order.status)
        );
      }

      // Apply detailed status filter
      if (selectedStatus !== "All") {
        filteredData = filteredData.filter(
          (order) => order.status === selectedStatus
        );
      }

      setFilteredOrders(filteredData);
    } else {
      setFilteredOrders([]);
    }
  }, [orders, filterText, selectedStatus, selectedGroup]);

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      const order = filteredOrders.find((o) => o.id === orderId);
      if (!order) return;

      const payload = {
        status,
      };

      await updateOrderStatus.mutateAsync({ id: orderId, order: payload });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSnackbarMessage("Order status updated successfully!");
      setSnackbarVisible(true);
    } catch (error) {
      setSnackbarMessage("Failed to update order status.");
      setSnackbarVisible(true);
    }
  };

  const getNextStatus = (
    currentStatus: string
  ): { label: string; value: string } | null => {
    switch (currentStatus) {
      case "placed":
        return { label: "Accept Order", value: "progress" };
      case "progress":
        return { label: "Mark as Delivered", value: "delivered" };
      case "delivered":
      case "cancelled":
      default:
        return null;
    }
  };

  // Count orders by status
  const countOrdersByStatus = (status: string) => {
    if (!orders) return 0;
    return orders.filter((order) => order.status === status).length;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          variant="headlineLarge"
          style={{ fontWeight: "700", fontSize: 24, color: "#21281B" }}
        >
          Orders
        </Text>

        {/* Order Status Row */}
        <View style={styles.statusRow}>
          <View style={styles.statusButtons}>
            <Text variant="titleMedium" style={styles.statusTitle}>
              Order Status
            </Text>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: "#C4532F" }]}
              textStyle={{
                color: "#fff",
                fontSize: 10,
                fontWeight: "500",
                textTransform: "uppercase",
              }}
              icon="clock-outline"
            >
              Placed: {countOrdersByStatus("placed")}
            </Chip>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: "#F8951D" }]}
              textStyle={{
                color: "#fff",
                fontSize: 10,
                fontWeight: "500",
                textTransform: "uppercase",
              }}
              icon="progress-clock"
            >
              Progress: {countOrdersByStatus("progress")}
            </Chip>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: "#657231" }]}
              textStyle={{
                color: "#fff",
                fontSize: 10,
                fontWeight: "500",
                textTransform: "uppercase",
              }}
              icon="check-circle-outline"
            >
              Delivered: {countOrdersByStatus("delivered")}
            </Chip>
          </View>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            style={styles.addButton}
            icon="plus"
            labelStyle={{ color: "#fff", fontSize: 15, fontWeight: "700" }}
          >
            Add Order
          </Button>
        </View>

        {/* Search Bar Full Width */}
        <View style={styles.searchContainer}>
          <TextInput
            // mode="outlined"
            placeholder="Search orders..."
            value={filterText}
            onChangeText={setFilterText}
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            outlineStyle={{ backgroundColor: "#91B27517" }}
          />
        </View>

        {/* Status Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContent}
          >
            {["All", "placed", "progress", "delivered", "cancelled"].map(
              (status) => (
                <Button
                  key={status}
                  mode={selectedStatus === status ? "contained" : "outlined"}
                  onPress={() => setSelectedStatus(status)}
                  style={[
                    styles.tabButton,
                    selectedStatus === status && styles.selectedTab,
                  ]}
                  labelStyle={[
                    styles.tabLabel,
                    selectedStatus === status && styles.selectedTabLabel,
                  ]}
                  compact
                >
                  {statusLabels[status as keyof typeof statusLabels]}
                </Button>
              )
            )}
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#91B275" />
          </View>
        ) : (
          <View style={styles.tableContainer}>
            <DataTable>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
                  <Text variant="bodyMedium" style={styles.headerCellText}>
                    Order ID
                  </Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.headerCell, { flex: 1 }]}>
                  <Text variant="bodyMedium" style={styles.headerCellText}>
                    Items
                  </Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.headerCell, { flex: 2 }]}>
                  <Text variant="bodyMedium" style={styles.headerCellText}>
                    Customer
                  </Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.headerCell, { flex: 2 }]}>
                  <Text variant="bodyMedium" style={styles.headerCellText}>
                    Branch
                  </Text>
                </DataTable.Title>
                <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
                  <Text variant="bodyMedium" style={styles.headerCellText}>
                    Status
                  </Text>
                </DataTable.Title>
              </DataTable.Header>

              {filteredOrders.map((order) => (
                <DataTable.Row
                  key={order.id}
                  onPress={() => router.push(`/orders/${order.id}`)}
                  style={styles.row}
                >
                  <DataTable.Cell style={[styles.cell, { flex: 1.5 }]}>
                    <Text
                      numberOfLines={1}
                      variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                      style={styles.cellText}
                    >
                      {order.order_id}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                    <Text
                      variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                      style={styles.cellText}
                    >
                      {order.items?.length || 0}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.cell, { flex: 2 }]}>
                    <Text
                      numberOfLines={1}
                      variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                      style={styles.cellText}
                    >
                      {typeof order.customer == "string"
                        ? order.customer
                        : order.customer?.full_name || "N/A"}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.cell, { flex: 2 }]}>
                    <Text
                      numberOfLines={2}
                      variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                      style={styles.cellText}
                    >
                      {typeof order.branch == "string"
                        ? order.branch
                        : order.branch?.address || "N/A"}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={[styles.cell, { flex: 1.5 }]}>
                    {(() => {
                      const nextStatus = getNextStatus(order.status);
                      return nextStatus ? (
                        <Button
                          mode="outlined"
                          compact
                          onPress={() =>
                            handleStatusUpdate(order.id, nextStatus.value)
                          }
                          style={styles.actionButton}
                          labelStyle={styles.actionButtonLabel}
                        >
                          {nextStatus.label}
                        </Button>
                      ) : (
                        <View
                          style={[
                            styles.statusChip,
                            order.status === "delivered" &&
                              styles.deliveredChip,
                            order.status === "cancelled" &&
                              styles.cancelledChip,
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </Text>
                        </View>
                      );
                    })()}
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </View>
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          style={styles.snackbar}
          duration={3000}
        >
          {snackbarMessage}
        </Snackbar>
      </View>
      {/* </View> */}
      {/* </Provider> */}

      <OrderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOrderCreated={() => {
          // You might want to refresh your orders list here
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF4EB",
    paddingVertical: 16,
    maxWidth: "100%",
    alignSelf: "center",
    width: "100%",
  },
  header: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    flexWrap: "wrap",
    gap: 16,
    width: "100%",
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: "medium",
    marginRight: 8,
    alignSelf: "center",
    color: "#202B189E",
  },
  statusButtons: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    flex: 1,
  },
  // statusChip: {
  //   marginRight: 8,
  //   borderWidth: 0,
  // },
  searchContainer: {
    width: "100%",
    borderWidth: 0,
    marginVertical: 16,
  },
  searchInput: {
    borderWidth: 0,
    borderRadius: 16,
    backgroundColor: "#91B27517",
    width: "100%",
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 16,
    height: 40,
    justifyContent: "center",
    alignSelf: "flex-end",
    backgroundColor: "#91B275",
  },
  tabContainer: {
    marginBottom: 16,
    maxHeight: 40,
  },
  tabContent: {
    paddingHorizontal: 4,
  },
  tabButton: {
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#91B27517",
    borderColor: "#5C5C5C33",
    paddingVertical: 8,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTab: {
    backgroundColor: "#91B275",
    borderColor: "#888",
  },
  tabLabel: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  selectedTabLabel: {
    fontWeight: "500",
    color: "#fff",
  },
  tableContainer: {
    borderWidth: 0,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#EFF4EB",
  },
  tableHeader: {
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerCell: {
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCellText: {
    fontSize: 13,
    fontWeight: "medium",
    color: "#4A4A4A",
  },
  cell: {
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  cellText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#21281B",
  },
  row: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionButton: {
    borderColor: "#6E504933",
  },
  actionButtonLabel: {
    color: "#281D1B",
    fontSize: 15,
  },
  statusChip: {
    height: 20,
    backgroundColor: "#91B27517",
    borderRadius: 7,
    borderWidth: 0.6,
    paddingHorizontal: 6,
    paddingVertical: 4.2,
    alignSelf: "flex-start",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deliveredChip: {
    backgroundColor: "#E8F5E9",
    borderWidth: 0,
  },
  cancelledChip: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
    borderWidth: 0.6,
  },
  statusText: {
    color: "#21281B",
    fontSize: 15,
    fontWeight: "500",
  },
  snackbar: {
    borderRadius: 8,
    margin: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
