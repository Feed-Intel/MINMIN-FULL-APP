import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Badge,
  Card,
  Chip,
  DataTable,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";

import BranchSelector from "@/components/BranchSelector";
import FiltersDrawer from "@/components/FiltersDrawer";
import { usePersistentFilters } from "@/hooks/usePersistentFilters";
import { OrderModal } from "./addOrder";
import { useRestaurantIdentity } from "@/hooks/useRestaurantIdentity";
import { resetPendingOrders } from "@/lib/reduxStore/orderSlice";
import { useOrders, useUpdateOrder } from "@/services/mutation/orderMutation";
import { Order } from "@/types/orderTypes";

type StatusFilterId =
  | "ALL"
  | "NEW"
  | "IN_PROGRESS"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

type ChannelFilterId = "ALL" | "DINE_IN" | "TAKEAWAY" | "DELIVERY";

type OrdersFilters = {
  status: StatusFilterId;
  channel: ChannelFilterId;
  from: string | null;
  to: string | null;
  branchId: string | null;
};

const STATUS_FILTERS: Array<{
  id: StatusFilterId;
  label: string;
  statuses?: Array<Order["status"]>;
}> = [
  { id: "ALL", label: "All" },
  { id: "NEW", label: "New", statuses: ["pending_payment", "placed"] },
  { id: "IN_PROGRESS", label: "In Progress", statuses: ["progress"] },
  { id: "READY", label: "Ready", statuses: ["payment_complete"] },
  {
    id: "COMPLETED",
    label: "Completed",
    statuses: ["delivered"],
  },
  { id: "CANCELLED", label: "Cancelled", statuses: ["cancelled"] },
];

const CHANNEL_FILTERS: Array<{ id: ChannelFilterId; label: string }> = [
  { id: "ALL", label: "All Channels" },
  { id: "DINE_IN", label: "Dine-in" },
  { id: "TAKEAWAY", label: "Takeaway" },
  { id: "DELIVERY", label: "Delivery" },
];

const STATUS_OVERVIEW = [
  { id: "new", label: "New", statuses: ["pending_payment", "placed"], icon: "clock-outline" },
  { id: "inProgress", label: "In Progress", statuses: ["progress"], icon: "progress-clock" },
  { id: "ready", label: "Ready", statuses: ["payment_complete"], icon: "tray" },
  {
    id: "completed",
    label: "Completed",
    statuses: ["delivered"],
    icon: "check-circle-outline",
  },
];

const STATUS_DISPLAY: Record<
  Order["status"],
  { label: string; borderColor: string; backgroundColor: string; textColor: string }
> = {
  pending_payment: {
    label: "Pending Payment",
    borderColor: "#F6C343",
    backgroundColor: "#FFF7E6",
    textColor: "#8A5C0A",
  },
  placed: {
    label: "New",
    borderColor: "#91B275",
    backgroundColor: "#E9F5E6",
    textColor: "#305535",
  },
  progress: {
    label: "In Progress",
    borderColor: "#3F8AE0",
    backgroundColor: "#E4F0FF",
    textColor: "#114A9F",
  },
  payment_complete: {
    label: "Ready",
    borderColor: "#AA68C7",
    backgroundColor: "#F2E8FB",
    textColor: "#5A2E7A",
  },
  delivered: {
    label: "Completed",
    borderColor: "#5CB85C",
    backgroundColor: "#E5F6E5",
    textColor: "#1E5F1E",
  },
  cancelled: {
    label: "Cancelled",
    borderColor: "#E55353",
    backgroundColor: "#FBE9E9",
    textColor: "#8A1C1C",
  },
};

const HIGHLIGHT_DURATION_MS = 5000;

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "ETB 0";
  const numeric = Number(amount) || 0;
  return `ETB ${numeric.toLocaleString()}`;
};

const formatTimestamp = (isoString: string) => {
  if (!isoString) return "-";
  return dayjs(isoString).format("MMM D • HH:mm");
};

const getChannelFromOrder = (order: Order): ChannelFilterId => {
  const table = order.table;
  if (table?.is_delivery_table) return "DELIVERY";
  if (table?.is_fast_table) return "TAKEAWAY";
  return "DINE_IN";
};

const channelLabel = (channel: ChannelFilterId) => {
  const option = CHANNEL_FILTERS.find((item) => item.id === channel);
  return option ? option.label : "Unknown";
};

export default function Orders() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const [searchTerm, setSearchTerm] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState<"from" | "to" | null>(null);
  const [newOrderToast, setNewOrderToast] = useState<{
    id: string;
    orderCode: string;
    items: number;
  } | null>(null);
  const [highlightedOrders, setHighlightedOrders] = useState<Record<string, boolean>>({});

  const queryClient = useQueryClient();
  const { data: orders, isLoading } = useOrders();
  const updateOrderStatus = useUpdateOrder();
  const dispatch = useDispatch();
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();

  const { value: filters, setValue: setFilters, reset: resetFilters, isHydrated } =
    usePersistentFilters<OrdersFilters>("restaurant-orders-filters", {
      status: "ALL",
      channel: "ALL",
      from: null,
      to: null,
      branchId: isBranch ? branchId ?? null : "all",
    });

  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const previousOrderIds = useRef<Set<string>>(new Set());
  const bootstrappedOrders = useRef(false);

  useEffect(() => {
    dispatch(resetPendingOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isBranch && branchId && filters.branchId !== branchId) {
      setFilters((prev) => ({ ...prev, branchId }));
    }
    if (!isBranch && !filters.branchId) {
      setFilters((prev) => ({ ...prev, branchId: "all" }));
    }
  }, [isHydrated, isBranch, branchId, filters.branchId, setFilters]);

  const selectedBranch = useMemo(() => {
    if (isBranch) return branchId ?? null;
    return filters.branchId;
  }, [filters.branchId, isBranch, branchId]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== "ALL") count += 1;
    if (filters.channel !== "ALL") count += 1;
    if (filters.from || filters.to) count += 1;
    if (!isBranch && filters.branchId && filters.branchId !== "all") count += 1;
    return count;
  }, [filters, isBranch]);

  const statusOverviewCounts = useMemo(() => {
    const counters: Record<string, number> = STATUS_OVERVIEW.reduce((acc, item) => {
      acc[item.id] = 0;
      return acc;
    }, {} as Record<string, number>);

    orders?.forEach((order) => {
      STATUS_OVERVIEW.forEach((meta) => {
        if (meta.statuses.includes(order.status)) {
          counters[meta.id] += 1;
        }
      });
    });

    return counters;
  }, [orders]);

  useEffect(() => {
    if (!orders) {
      previousOrderIds.current = new Set();
      return;
    }

    const currentIds = new Set(orders.map((order) => order.id));

    if (!bootstrappedOrders.current) {
      bootstrappedOrders.current = true;
      previousOrderIds.current = currentIds;
      return;
    }

    const newlyAdded = orders.filter(
      (order) => !previousOrderIds.current.has(order.id)
    );

    if (newlyAdded.length) {
      setNewOrderToast({
        id: newlyAdded[0].id,
        orderCode: newlyAdded[0].order_id,
        items: newlyAdded[0].items?.length ?? 0,
      });

      newlyAdded.forEach((order) => {
        setHighlightedOrders((prev) => ({ ...prev, [order.id]: true }));

        if (highlightTimers.current[order.id]) {
          clearTimeout(highlightTimers.current[order.id]);
        }

        highlightTimers.current[order.id] = setTimeout(() => {
          setHighlightedOrders((prev) => {
            const next = { ...prev };
            delete next[order.id];
            return next;
          });
          delete highlightTimers.current[order.id];
        }, HIGHLIGHT_DURATION_MS);
      });
    }

    previousOrderIds.current = currentIds;
  }, [orders]);

  useEffect(() => {
    return () => {
      Object.values(highlightTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const statusLookup = new Set(
      STATUS_FILTERS.find((item) => item.id === filters.status)?.statuses ?? []
    );

    return orders
      .filter((order) => {
        if (selectedBranch && selectedBranch !== "all") {
          const branchValue =
            typeof order.branch === "object" ? order.branch?.id : order.branch;
          if (branchValue !== selectedBranch) return false;
        }

        if (filters.status !== "ALL" && !statusLookup.has(order.status)) {
          return false;
        }

        if (filters.channel !== "ALL") {
          const orderChannel = getChannelFromOrder(order);
          if (orderChannel !== filters.channel) return false;
        }

        if (filters.from) {
          const fromDate = dayjs(filters.from);
          if (dayjs(order.created_at).isBefore(fromDate, "day")) return false;
        }

        if (filters.to) {
          const toDate = dayjs(filters.to);
          if (dayjs(order.created_at).isAfter(toDate, "day")) return false;
        }

        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;

        const customerName =
          typeof order.customer === "string"
            ? order.customer.toLowerCase()
            : order.customer?.full_name?.toLowerCase() ?? "";
        const branchAddress =
          typeof order.branch === "string"
            ? order.branch.toLowerCase()
            : order.branch?.address?.toLowerCase() ?? "";
        const orderId = order.order_id?.toLowerCase() ?? "";

        return (
          customerName.includes(term) ||
          branchAddress.includes(term) ||
          orderId.includes(term)
        );
      })
      .sort(
        (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
      );
  }, [orders, filters, selectedBranch, searchTerm]);

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: Order["status"]) => {
      try {
        await updateOrderStatus.mutateAsync({ id: orderId, order: { status } });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        setSnackbarMessage("Order status updated successfully");
        setSnackbarVisible(true);
      } catch (error) {
        setSnackbarMessage("Failed to update order status");
        setSnackbarVisible(true);
      }
    },
    [queryClient, updateOrderStatus]
  );

  const getNextStatus = useCallback((currentStatus: Order["status"]) => {
    switch (currentStatus) {
      case "pending_payment":
        return {
          label: "Record Payment",
          value: "payment_complete" as Order["status"],
        };
      case "placed":
        return {
          label: "Start Preparing",
          value: "progress" as Order["status"],
        };
      case "progress":
        return {
          label: "Mark Ready",
          value: "payment_complete" as Order["status"],
        };
      case "payment_complete":
        return {
          label: "Mark Delivered",
          value: "delivered" as Order["status"],
        };
      default:
        return null;
    }
  }, []);

  const handleBranchChange = useCallback(
    (branchValue: string) => {
      setFilters((prev) => ({ ...prev, branchId: branchValue }));
    },
    [setFilters]
  );

  const openOrderDetail = useCallback((orderId: string) => {
    router.push(`/orders/${orderId}`);
  }, []);

  const renderStatusTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
    >
      {STATUS_FILTERS.map((status) => {
        const isSelected = filters.status === status.id;
        return (
          <Button
            key={status.id}
            mode={isSelected ? "contained" : "outlined"}
            onPress={() => setFilters((prev) => ({ ...prev, status: status.id }))}
            style={[styles.tabButton, isSelected && styles.selectedTab]}
            labelStyle={[styles.tabLabel, isSelected && styles.selectedTabLabel]}
            compact
          >
            {status.label}
          </Button>
        );
      })}
    </ScrollView>
  );
  return (
    <View style={rootStyles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card mode="outlined" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View style={[styles.headerRow, isSmallScreen && styles.headerRowStack]}>
              <View style={styles.titleGroup}>
                <Text variant="headlineSmall" style={styles.title}>
                  Orders
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  Track and manage orders in real-time across every service channel.
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={() => setModalVisible(true)}
                style={styles.addButton}
                icon="plus"
                labelStyle={styles.addButtonLabel}
              >
                Add Order
              </Button>
            </View>

            <View style={[styles.controlsRow, isSmallScreen && styles.controlsRowStack]}>
              <BranchSelector
                selectedBranch={selectedBranch}
                onChange={handleBranchChange}
                includeAllOption={isRestaurant}
                style={styles.branchSelectorWrapper}
              />
              <View style={styles.searchContainer}>
                <TextInput
                  mode="outlined"
                  placeholder="Search by customer, branch, or order ID"
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  style={styles.searchInput}
                  left={<TextInput.Icon icon="magnify" />}
                  outlineStyle={{ borderWidth: 0 }}
                  theme={{ colors: { secondary: "#91B275" } }}
                />
              </View>
              <View style={styles.filterButtonWrapper}>
                <Button
                  mode="outlined"
                  icon="tune"
                  onPress={() => setFiltersVisible(true)}
                  style={styles.filterButton}
                  labelStyle={styles.filterButtonLabel}
                >
                  Filters
                </Button>
                {activeFiltersCount > 0 && (
                  <Badge style={styles.filterBadge}>{activeFiltersCount}</Badge>
                )}
              </View>
            </View>

            <View style={styles.statusOverviewRow}>
              {STATUS_OVERVIEW.map((item) => (
                <Chip
                  key={item.id}
                  mode="outlined"
                  icon={item.icon}
                  style={styles.overviewChip}
                  textStyle={styles.overviewChipLabel}
                >
                  {item.label} · {statusOverviewCounts[item.id] ?? 0}
                </Chip>
              ))}
            </View>

            <View style={styles.tabContainer}>{renderStatusTabs()}</View>

            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#91B275" />
              </View>
            ) : (
              <View style={styles.tableWrapper}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Order
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.2 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Placed
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.1 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Channel
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Items
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Customer
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Branch
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.4 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Total
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        Status
                      </Text>
                    </DataTable.Title>
                  </DataTable.Header>
                  {filteredOrders.map((order) => {
                    const nextStatus = getNextStatus(order.status);
                    const statusMeta =
                      STATUS_DISPLAY[order.status] ?? {
                        label: order.status.replace(/_/g, " "),
                        borderColor: "#D6DCCD",
                        backgroundColor: "#EEF1EB",
                        textColor: "#21281B",
                      };
                    const orderChannel = getChannelFromOrder(order);
                    const isHighlighted = Boolean(highlightedOrders[order.id]);

                    return (
                      <DataTable.Row
                        key={order.id}
                        onPress={() => openOrderDetail(order.id)}
                        style={[styles.row, isHighlighted && styles.highlightedRow]}
                      >
                        <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                          {isHighlighted && <View style={styles.newIndicator} />}
                          <View>
                            <Text
                              numberOfLines={1}
                              variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                              style={styles.cellText}
                            >
                              {order.order_id}
                            </Text>
                            <Text variant="bodySmall" style={styles.orderIdMeta}>
                              {order.id.slice(0, 8).toUpperCase()}
                            </Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.2 }]}>
                          <Text variant="bodySmall" style={styles.cellSubtext}>
                            {formatTimestamp(order.created_at)}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.1 }]}>
                          <View style={styles.channelBadge}>
                            <Text style={styles.channelBadgeText}>
                              {channelLabel(orderChannel)}
                            </Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                          <Text style={styles.cellText}>{order.items?.length ?? 0}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                          <Text
                            numberOfLines={1}
                            variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                            style={styles.cellText}
                          >
                            {typeof order.customer === "string"
                              ? order.customer
                              : order.customer?.full_name ?? "N/A"}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                          <Text
                            numberOfLines={2}
                            variant={isSmallScreen ? "bodySmall" : "bodyMedium"}
                            style={styles.cellText}
                          >
                            {typeof order.branch === "string"
                              ? order.branch
                              : order.branch?.address ?? "N/A"}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.4 }]}>
                          <Text style={styles.cellText}>
                            {formatCurrency(order.total_price)}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.5 }]}>
                          {nextStatus ? (
                            <Button
                              mode="outlined"
                              compact
                              onPress={() => handleStatusUpdate(order.id, nextStatus.value)}
                              style={styles.actionButton}
                              labelStyle={styles.actionButtonLabel}
                            >
                              {nextStatus.label}
                            </Button>
                          ) : (
                            <View
                              style={[
                                styles.statusPill,
                                {
                                  borderColor: statusMeta.borderColor,
                                  backgroundColor: statusMeta.backgroundColor,
                                },
                              ]}
                            >
                              <Text
                                style={{ color: statusMeta.textColor, fontWeight: "600" }}
                              >
                                {statusMeta.label}
                              </Text>
                            </View>
                          )}
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })}
                </DataTable>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
      <FiltersDrawer
        visible={filtersVisible}
        onDismiss={() => setFiltersVisible(false)}
        onReset={() => {
          resetFilters();
          setFiltersVisible(false);
        }}
        onApply={() => setFiltersVisible(false)}
      >
        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>Status</Text>
          <View style={styles.filtersChipRow}>
            {STATUS_FILTERS.map((status) => (
              <Chip
                key={status.id}
                mode={filters.status === status.id ? "flat" : "outlined"}
                onPress={() => setFilters((prev) => ({ ...prev, status: status.id }))}
                selected={filters.status === status.id}
              >
                {status.label}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>Channel</Text>
          <View style={styles.filtersChipRow}>
            {CHANNEL_FILTERS.map((channel) => (
              <Chip
                key={channel.id}
                mode={filters.channel === channel.id ? "flat" : "outlined"}
                onPress={() => setFilters((prev) => ({ ...prev, channel: channel.id }))}
                selected={filters.channel === channel.id}
              >
                {channel.label}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>Date range</Text>
          <View style={styles.dateRow}>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setDatePickerField("from")}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
            >
              {filters.from ? dayjs(filters.from).format("MMM D, YYYY") : "Start date"}
            </Button>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setDatePickerField("to")}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
            >
              {filters.to ? dayjs(filters.to).format("MMM D, YYYY") : "End date"}
            </Button>
          </View>
          {(filters.from || filters.to) && (
            <Button
              mode="text"
              compact
              onPress={() => setFilters((prev) => ({ ...prev, from: null, to: null }))}
              style={styles.clearDateButton}
            >
              Clear dates
            </Button>
          )}
        </View>

        {!isBranch && (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersLabel}>Branch</Text>
            <BranchSelector
              selectedBranch={filters.branchId}
              onChange={handleBranchChange}
              includeAllOption={isRestaurant}
            />
          </View>
        )}
      </FiltersDrawer>

      <DatePickerModal
        locale="en"
        mode="single"
        visible={datePickerField !== null}
        onDismiss={() => setDatePickerField(null)}
        date={(() => {
          if (datePickerField === "from") {
            return filters.from ? dayjs(filters.from).toDate() : undefined;
          }
          if (datePickerField === "to") {
            return filters.to ? dayjs(filters.to).toDate() : undefined;
          }
          return undefined;
        })()}
        onConfirm={({ date }) => {
          if (!datePickerField) return;
          const formatted = dayjs(date).format("YYYY-MM-DD");

          setFilters((prev) => {
            if (datePickerField === "from") {
              return { ...prev, from: formatted };
            }
            if (datePickerField === "to") {
              return { ...prev, to: formatted };
            }
            return prev;
          });

          setDatePickerField(null);
        }}
      />

      <Snackbar
        visible={Boolean(newOrderToast)}
        onDismiss={() => setNewOrderToast(null)}
        style={styles.toastSnackbar}
        duration={3500}
        action={{
          label: "View",
          onPress: () => {
            if (newOrderToast) {
              openOrderDetail(newOrderToast.id);
            }
          },
        }}
      >
        {newOrderToast
          ? `New order ${newOrderToast.orderCode} — ${newOrderToast.items} items`
          : ""}
      </Snackbar>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        style={styles.snackbar}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      <OrderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onOrderCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
        }}
      />
    </View>
  );
}
const rootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF4EB",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#EFF4EB",
    borderColor: "transparent",
  },
  cardContent: {
    gap: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  headerRowStack: {
    flexDirection: "column",
  },
  titleGroup: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontWeight: "700",
    color: "#21281B",
  },
  subtitle: {
    color: "#4A4A4A",
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 20,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
  },
  addButtonLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  controlsRowStack: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  branchSelectorWrapper: {
    flexBasis: 260,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    borderRadius: 12,
    backgroundColor: "#91B27517",
  },
  filterButtonWrapper: {
    position: "relative",
  },
  filterButton: {
    borderRadius: 16,
    backgroundColor: "#EFF4EB",
    borderColor: "#5C5C5C33",
    paddingHorizontal: 16,
  },
  filterButtonLabel: {
    color: "#21281B",
    fontWeight: "600",
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -10,
  },
  statusOverviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  overviewChip: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderColor: "#E1E5DC",
  },
  overviewChipLabel: {
    fontWeight: "600",
    color: "#21281B",
  },
  tabContainer: {
    maxHeight: 44,
  },
  tabContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  tabButton: {
    borderRadius: 16,
    borderColor: "#5C5C5C33",
    backgroundColor: "#EFF4EB",
    paddingHorizontal: 18,
  },
  selectedTab: {
    backgroundColor: "#91B275",
    borderColor: "#4d6e33",
  },
  tabLabel: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  selectedTabLabel: {
    color: "#fff",
    fontWeight: "600",
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1E5DC",
    backgroundColor: "#fff",
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  headerCell: {
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCellText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  row: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F3",
  },
  highlightedRow: {
    backgroundColor: "#F1F8E9",
  },
  newIndicator: {
    width: 4,
    borderRadius: 999,
    backgroundColor: "#91B275",
    marginRight: 12,
  },
  cell: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
  },
  cellText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#21281B",
  },
  cellSubtext: {
    color: "#5C6F46",
    fontSize: 13,
    fontWeight: "500",
  },
  orderIdMeta: {
    color: "#607250",
    fontSize: 12,
    marginTop: 2,
  },
  channelBadge: {
    backgroundColor: "#EEF1EB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  channelBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3A4A2A",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  actionButton: {
    borderColor: "#6E504933",
    borderRadius: 999,
  },
  actionButtonLabel: {
    color: "#281D1B",
    fontSize: 14,
  },
  snackbar: {
    borderRadius: 8,
    margin: 16,
    backgroundColor: "#21281B",
  },
  toastSnackbar: {
    borderRadius: 12,
    margin: 16,
    backgroundColor: "#2C3A23",
  },
  filtersSection: {
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#21281B",
  },
  filtersChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  dateButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: "#CBD3C2",
    borderWidth: 1,
    justifyContent: "flex-start",
  },
  dateButtonLabel: {
    color: "#21281B",
    fontWeight: "500",
  },
  clearDateButton: {
    alignSelf: "flex-start",
    marginTop: -6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
});
