import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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
} from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';

import BranchSelector from '@/components/BranchSelector';
import FiltersDrawer from '@/components/FiltersDrawer';
import { usePersistentFilters } from '@/hooks/usePersistentFilters';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import { resetPendingOrders } from '@/lib/reduxStore/orderSlice';
import { useOrders, useUpdateOrder } from '@/services/mutation/orderMutation';
import { ChannelFilterId, Order } from '@/types/orderTypes';
import Pagination from '@/components/Pagination';
import { i18n as I18n } from '@/app/_layout';

type StatusFilterId =
  | 'ALL'
  | 'NEW'
  | 'IN_PROGRESS'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

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
  statuses?: Array<Order['status']>;
}> = [
  { id: 'ALL', label: I18n.t('menus.category.All') },
  {
    id: 'NEW',
    label: I18n.t('Common.new'),
    statuses: ['placed'],
  },
  {
    id: 'IN_PROGRESS',
    label: I18n.t('Common.in_progress'),
    statuses: ['progress'],
  },
  {
    id: 'READY',
    label: I18n.t('Common.ready'),
    statuses: ['payment_complete'],
  },
  {
    id: 'COMPLETED',
    label: I18n.t('Common.completed'),
    statuses: ['delivered'],
  },
  {
    id: 'CANCELLED',
    label: I18n.t('Common.cancelled'),
    statuses: ['cancelled'],
  },
];

const CHANNEL_FILTERS: Array<{ id: ChannelFilterId; label: string }> = [
  { id: 'ALL', label: I18n.t('Common.all_channels') },
  { id: 'DINE_IN', label: I18n.t('Common.dine_in') },
  { id: 'TAKEAWAY', label: I18n.t('Common.take_away') },
  { id: 'DELIVERY', label: I18n.t('Common.delivery') },
];

const STATUS_OVERVIEW = [
  {
    id: 'new',
    label: I18n.t('Common.new'),
    statuses: ['pending_payment', 'placed'],
    icon: 'clock-outline',
  },
  {
    id: 'inProgress',
    label: I18n.t('Common.in_progress'),
    statuses: ['progress'],
    icon: 'progress-clock',
  },
  {
    id: 'ready',
    label: I18n.t('Common.ready'),
    statuses: ['payment_complete'],
    icon: 'tray',
  },
  {
    id: 'completed',
    label: I18n.t('Common.completed'),
    statuses: ['delivered'],
    icon: 'check-circle-outline',
  },
];

const STATUS_DISPLAY: Record<
  Order['status'],
  {
    label: string;
    borderColor: string;
    backgroundColor: string;
    textColor: string;
  }
> = {
  pending_payment: {
    label: 'Pending Payment',
    borderColor: '#F6C343',
    backgroundColor: '#FFF7E6',
    textColor: '#8A5C0A',
  },
  placed: {
    label: I18n.t('Common.placed'),
    borderColor: '#91B275',
    backgroundColor: '#E9F5E6',
    textColor: '#305535',
  },
  progress: {
    label: I18n.t('Common.in_progress'),
    borderColor: '#3F8AE0',
    backgroundColor: '#E4F0FF',
    textColor: '#114A9F',
  },
  payment_complete: {
    label: I18n.t('Common.ready'),
    borderColor: '#AA68C7',
    backgroundColor: '#F2E8FB',
    textColor: '#5A2E7A',
  },
  delivered: {
    label: I18n.t('Common.completed'),
    borderColor: '#5CB85C',
    backgroundColor: '#E5F6E5',
    textColor: '#1E5F1E',
  },
  cancelled: {
    label: I18n.t('Common.cancelled'),
    borderColor: '#E55353',
    backgroundColor: '#FBE9E9',
    textColor: '#8A1C1C',
  },
};

const HIGHLIGHT_DURATION_MS = 5000;

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'ETB 0';
  const numeric = Number(amount) || 0;
  return `ETB ${numeric.toLocaleString()}`;
};

const formatTimestamp = (isoString: string) => {
  if (!isoString) return '-';
  return dayjs(isoString).format('MMM D • HH:mm');
};

const getChannelFromOrder = (order: Order): ChannelFilterId => {
  const table = order.table;
  if (table?.is_delivery_table) return 'DELIVERY';
  if (table?.is_fast_table) return 'TAKEAWAY';
  return 'DINE_IN';
};

const channelLabel = (channel: ChannelFilterId) => {
  const option = CHANNEL_FILTERS.find((item) => item.id === channel);
  return option ? option.label : 'Unknown';
};

// This component assumes I18n is available and configured
// E.g., import I18n from 'i18n-js';

export default function Orders() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;

  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [datePickerField, setDatePickerField] = useState<'from' | 'to' | null>(
    null
  );
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debouncedSearch = useMemo(
    () => debounce((q: string) => setDebouncedQuery(q), 300),
    []
  );
  const [newOrderToast, setNewOrderToast] = useState<{
    id: string;
    orderCode: string;
    items: number;
  } | null>(null);
  const [highlightedOrders, setHighlightedOrders] = useState<
    Record<string, boolean>
  >({});

  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const updateOrderStatus = useUpdateOrder();
  const dispatch = useDispatch();
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();
  const {
    value: filters,
    setValue: setFilters,
    reset: resetFilters,
    isHydrated,
  } = usePersistentFilters<OrdersFilters>('restaurant-orders-filters', {
    status: 'ALL',
    channel: 'ALL',
    from: null,
    to: null,
    branchId: isBranch ? branchId ?? null : 'all',
  });
  const selectedBranch = useMemo(() => {
    if (isBranch) return branchId ?? null;
    return filters.branchId;
  }, [filters.branchId, isBranch, branchId]);

  const highlightTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {}
  );
  const previousOrderIds = useRef<Set<string>>(new Set());
  const bootstrappedOrders = useRef(false);
  const queryParams = useMemo(() => {
    const statusFilter = STATUS_FILTERS.find(
      (item) => item.id === filters.status
    );
    const apiStatuses = statusFilter?.statuses;

    return {
      page: currentPage,
      status:
        filters.status !== 'ALL' && apiStatuses
          ? apiStatuses.join(',')
          : undefined,
      channel: filters.channel !== 'ALL' ? filters.channel : undefined,
      from_date: filters.from,
      to_date: filters.to,
      branch: selectedBranch === 'all' ? undefined : selectedBranch,
      search: debouncedQuery,
    };
  }, [
    currentPage,
    filters.status,
    filters.channel,
    filters.from,
    filters.to,
    selectedBranch,
    debouncedQuery,
  ]);
  const { data: orders, isLoading } = useOrders(queryParams);

  useEffect(() => {
    dispatch(resetPendingOrders());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    if (!isHydrated) return;
    if (isBranch && branchId && filters.branchId !== branchId) {
      setFilters((prev) => ({ ...prev, branchId }));
    }
    if (!isBranch && !filters.branchId) {
      setFilters((prev) => ({ ...prev, branchId: 'all' }));
    }
  }, [isHydrated, isBranch, branchId, filters.branchId, setFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'ALL') count += 1;
    if (filters.channel !== 'ALL') count += 1;
    if (filters.from || filters.to) count += 1;
    if (!isBranch && filters.branchId && filters.branchId !== 'all') count += 1;
    return count;
  }, [filters, isBranch]);

  const statusOverviewCounts = useMemo(() => {
    const counters: Record<string, number> = STATUS_OVERVIEW.reduce(
      (acc, item) => {
        acc[item.id] = 0;
        return acc;
      },
      {} as Record<string, number>
    );

    orders?.results.forEach((order) => {
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

    const currentIds = new Set(orders.results.map((order) => order.id));

    if (!bootstrappedOrders.current) {
      bootstrappedOrders.current = true;
      previousOrderIds.current = currentIds;
      return;
    }

    const newlyAdded = orders.results.filter(
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
      Object.values(highlightTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, []);

  const filteredOrders = useMemo(() => {
    return orders?.results ?? [];
  }, [orders]);

  const handleStatusUpdate = useCallback(
    async (orderId: string, status: Order['status']) => {
      try {
        await updateOrderStatus.mutateAsync({ id: orderId, order: { status } });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        setSnackbarMessage(I18n.t('orders.snackbarSuccess'));
        setSnackbarVisible(true);
      } catch (error) {
        setSnackbarMessage(I18n.t('orders.snackbarFailure'));
        setSnackbarVisible(true);
      }
    },
    [queryClient, updateOrderStatus]
  );

  const getNextStatus = useCallback((currentStatus: Order['status']) => {
    switch (currentStatus) {
      case 'pending_payment':
        return {
          label: I18n.t('orders.actionRecordPayment'),
          value: 'payment_complete' as Order['status'],
        };
      case 'placed':
        return {
          label: I18n.t('orders.actionStartPreparing'),
          value: 'progress' as Order['status'],
        };
      case 'progress':
        return {
          label: I18n.t('orders.actionMarkReady'),
          value: 'payment_complete' as Order['status'],
        };
      case 'payment_complete':
        return {
          label: I18n.t('orders.actionMarkDelivered'),
          value: 'delivered' as Order['status'],
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
          // NOTE: status.label is assumed to be translated at the source of STATUS_FILTERS
          <Button
            key={status.id}
            mode={isSelected ? 'contained' : 'outlined'}
            onPress={() =>
              setFilters((prev) => ({ ...prev, status: status.id }))
            }
            style={[styles.tabButton, isSelected && styles.selectedTab]}
            labelStyle={[
              styles.tabLabel,
              isSelected && styles.selectedTabLabel,
            ]}
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
            <View
              style={[styles.headerRow, isSmallScreen && styles.headerRowStack]}
            >
              <View style={styles.titleGroup}>
                <Text variant="headlineSmall" style={styles.title}>
                  {I18n.t('orders.title')}
                </Text>
                <Text variant="bodyMedium" style={styles.subtitle}>
                  {I18n.t('orders.subtitle')}
                </Text>
              </View>
              <Button
                mode="contained"
                onPress={() => router.push('/(protected)/orders/createOrder')}
                style={styles.addButton}
                icon="plus"
                labelStyle={styles.addButtonLabel}
              >
                {I18n.t('orders.addButton')}
              </Button>
            </View>

            <View
              style={[
                styles.controlsRow,
                isSmallScreen && styles.controlsRowStack,
              ]}
            >
              <BranchSelector
                selectedBranch={selectedBranch}
                onChange={handleBranchChange}
                includeAllOption={isRestaurant}
                style={styles.branchSelectorWrapper}
              />
              <View style={styles.searchContainer}>
                <TextInput
                  mode="outlined"
                  placeholder={I18n.t('orders.searchPlaceholder')}
                  value={searchTerm}
                  onChangeText={(text) => {
                    setCurrentPage(1);
                    setSearchTerm(text);
                    debouncedSearch(text);
                  }}
                  style={styles.searchInput}
                  left={<TextInput.Icon icon="magnify" />}
                  outlineStyle={{ borderWidth: 0 }}
                  theme={{ colors: { secondary: '#91B275' } }}
                  textColor="#000000"
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
                  {I18n.t('orders.filterButton')}
                </Button>
                {activeFiltersCount > 0 && (
                  <Badge style={styles.filterBadge}>{activeFiltersCount}</Badge>
                )}
              </View>
            </View>

            <View style={styles.statusOverviewRow}>
              {STATUS_OVERVIEW.map((item) => (
                // NOTE: item.label is assumed to be translated at the source of STATUS_OVERVIEW
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
                        {I18n.t('orders.tableHeaderOrder')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.2 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderPlaced')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.1 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderChannel')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderItems')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderCustomer')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.6 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderBranch')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.4 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderTotal')}
                      </Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, { flex: 1.5 }]}>
                      <Text variant="bodyMedium" style={styles.headerCellText}>
                        {I18n.t('orders.tableHeaderStatus')}
                      </Text>
                    </DataTable.Title>
                  </DataTable.Header>
                  {filteredOrders.map((order) => {
                    const nextStatus = getNextStatus(order.status);
                    const statusMeta = STATUS_DISPLAY[order.status] ?? {
                      // NOTE: If statusMeta is dynamically derived, it will need to be wrapped in I18n.t() at its source or here.
                      // Assuming statusMeta.label is a direct string from a lookup table.
                      label: order.status.replace(/_/g, ' '),
                      borderColor: '#D6DCCD',
                      backgroundColor: '#EEF1EB',
                      textColor: '#21281B',
                    };
                    const orderChannel = getChannelFromOrder(order);
                    const isHighlighted = Boolean(highlightedOrders[order.id]);

                    return (
                      <DataTable.Row
                        key={order.id}
                        onPress={() => openOrderDetail(order.id)}
                        style={[
                          styles.row,
                          isHighlighted && styles.highlightedRow,
                        ]}
                      >
                        <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                          {isHighlighted && (
                            <View style={styles.newIndicator} />
                          )}
                          <View>
                            <Text
                              numberOfLines={1}
                              variant={
                                isSmallScreen ? 'bodySmall' : 'bodyMedium'
                              }
                              style={styles.cellText}
                            >
                              {order.order_id}
                            </Text>
                            <Text
                              variant="bodySmall"
                              style={styles.orderIdMeta}
                            >
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
                              {/* channelLabel is an external function, assuming it's translated */}
                              {channelLabel(orderChannel)}
                            </Text>
                          </View>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1 }]}>
                          <Text style={styles.cellText}>
                            {order.items?.length ?? 0}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                          <Text
                            numberOfLines={1}
                            variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                            style={styles.cellText}
                          >
                            {typeof order.customer === 'string'
                              ? order.customer
                              : order.customer?.full_name ??
                                I18n.t('Common.na')}
                          </Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={[styles.cell, { flex: 1.6 }]}>
                          <Text
                            numberOfLines={2}
                            variant={isSmallScreen ? 'bodySmall' : 'bodyMedium'}
                            style={styles.cellText}
                          >
                            {typeof order.branch === 'string'
                              ? order.branch
                              : order.branch?.address ?? I18n.t('Common.na')}
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
                                styles.statusPill,
                                {
                                  borderColor: statusMeta.borderColor,
                                  backgroundColor: statusMeta.backgroundColor,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color: statusMeta.textColor,
                                  fontWeight: '600',
                                }}
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
                <Pagination
                  totalPages={Math.ceil((orders?.count ?? 0) / 10)} // Use Math.ceil for accurate page count
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                />
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
        onApply={() => {
          setFiltersVisible(false);
        }}
        title={I18n.t('orders.filterButton')}
      >
        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>
            {I18n.t('filters.statusLabel')}
          </Text>
          <View style={styles.filtersChipRow}>
            {STATUS_FILTERS.map((status) => (
              // NOTE: status.label is assumed to be translated at the source of STATUS_FILTERS
              <Chip
                key={status.id}
                mode={filters.status === status.id ? 'flat' : 'outlined'}
                onPress={() =>
                  setFilters((prev) => ({ ...prev, status: status.id }))
                }
                selected={filters.status === status.id}
                style={{
                  backgroundColor:
                    filters.status === status.id ? '#91B275' : '#fff',
                }}
              >
                {status.label}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>
            {I18n.t('filters.channelLabel')}
          </Text>
          <View style={styles.filtersChipRow}>
            {CHANNEL_FILTERS.map((channel) => (
              // NOTE: channel.label is assumed to be translated at the source of CHANNEL_FILTERS
              <Chip
                key={channel.id}
                mode={filters.channel === channel.id ? 'flat' : 'outlined'}
                onPress={() =>
                  setFilters((prev) => ({ ...prev, channel: channel.id }))
                }
                selected={filters.channel === channel.id}
                style={{
                  backgroundColor:
                    filters.channel === channel.id ? '#91B275' : '#fff',
                }}
              >
                {channel.label}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filtersLabel}>
            {I18n.t('filters.dateRangeLabel')}
          </Text>
          <View style={styles.dateRow}>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setDatePickerField('from')}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
            >
              {filters.from
                ? dayjs(filters.from).format('MMM D, YYYY')
                : I18n.t('filters.startDatePlaceholder')}
            </Button>
            <Button
              mode="outlined"
              icon="calendar"
              onPress={() => setDatePickerField('to')}
              style={styles.dateButton}
              labelStyle={styles.dateButtonLabel}
            >
              {filters.to
                ? dayjs(filters.to).format('MMM D, YYYY')
                : I18n.t('filters.endDatePlaceholder')}
            </Button>
          </View>
          {(filters.from || filters.to) && (
            <Button
              mode="text"
              compact
              onPress={() =>
                setFilters((prev) => ({ ...prev, from: null, to: null }))
              }
              style={styles.clearDateButton}
            >
              {I18n.t('filters.clearDatesButton')}
            </Button>
          )}
        </View>

        {!isBranch && (
          <View style={styles.filtersSection}>
            <Text style={styles.filtersLabel}>
              {I18n.t('filters.branchLabel')}
            </Text>
            <BranchSelector
              selectedBranch={filters.branchId}
              onChange={(branchId) => {
                setCurrentPage(1);
                handleBranchChange(branchId);
              }}
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
          if (datePickerField === 'from') {
            return filters.from ? dayjs(filters.from).toDate() : undefined;
          }
          if (datePickerField === 'to') {
            return filters.to ? dayjs(filters.to).toDate() : undefined;
          }
          return undefined;
        })()}
        onConfirm={({ date }) => {
          if (!datePickerField) return;
          const formatted = dayjs(date).format('YYYY-MM-DD');

          setFilters((prev) => {
            if (datePickerField === 'from') {
              return { ...prev, from: formatted };
            }
            if (datePickerField === 'to') {
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
          label: I18n.t('orders.toastViewAction'),
          onPress: () => {
            if (newOrderToast) {
              openOrderDetail(newOrderToast.id);
            }
          },
        }}
      >
        {newOrderToast
          ? I18n.t('orders.newOrderToast', {
              orderCode: newOrderToast.orderCode,
              items: newOrderToast.items,
            })
          : ''}
      </Snackbar>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        style={styles.snackbar}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const rootStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4EB',
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
    backgroundColor: '#EFF4EB',
    borderColor: 'transparent',
  },
  cardContent: {
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerRowStack: {
    flexDirection: 'column',
  },
  titleGroup: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontWeight: '700',
    color: '#21281B',
  },
  subtitle: {
    color: '#4A4A4A',
  },
  addButton: {
    backgroundColor: '#91B275',
    borderRadius: 20,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  addButtonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  controlsRowStack: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  branchSelectorWrapper: {
    flexBasis: 260,
  },
  searchContainer: {
    flex: 1,
  },
  searchInput: {
    borderRadius: 12,
    backgroundColor: '#91B27517',
  },
  filterButtonWrapper: {
    position: 'relative',
  },
  filterButton: {
    borderRadius: 16,
    backgroundColor: '#EFF4EB',
    borderColor: '#5C5C5C33',
    paddingHorizontal: 16,
  },
  filterButtonLabel: {
    color: '#21281B',
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
  },
  statusOverviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overviewChip: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E5DC',
  },
  overviewChipLabel: {
    fontWeight: '600',
    color: '#21281B',
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
    borderColor: '#5C5C5C33',
    backgroundColor: '#EFF4EB',
    paddingHorizontal: 18,
  },
  selectedTab: {
    backgroundColor: '#91B275',
    borderColor: '#4d6e33',
  },
  tabLabel: {
    color: '#333',
    fontSize: 15,
    fontWeight: '500',
  },
  selectedTabLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E5DC',
    backgroundColor: '#EFF4EB',
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerCell: {
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A4A4A',
  },
  row: {
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  highlightedRow: {
    backgroundColor: '#F1F8E9',
  },
  newIndicator: {
    width: 4,
    borderRadius: 999,
    backgroundColor: '#91B275',
    marginRight: 12,
  },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    flex: 1,
  },
  cellText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#21281B',
  },
  cellSubtext: {
    color: '#5C6F46',
    fontSize: 13,
    fontWeight: '500',
  },
  orderIdMeta: {
    color: '#607250',
    fontSize: 12,
    marginTop: 2,
  },
  channelBadge: {
    backgroundColor: '#EEF1EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  channelBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3A4A2A',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  actionButton: {
    borderColor: '#6E504933',
    borderRadius: 999,
  },
  actionButtonLabel: {
    color: '#281D1B',
    fontSize: 14,
  },
  snackbar: {
    borderRadius: 8,
    margin: 16,
    backgroundColor: '#21281B',
  },
  toastSnackbar: {
    borderRadius: 12,
    margin: 16,
    backgroundColor: '#2C3A23',
  },
  filtersSection: {
    gap: 12,
  },
  filtersLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#21281B',
  },
  filtersChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
    borderRadius: 12,
    borderColor: '#CBD3C2',
    borderWidth: 1,
    justifyContent: 'flex-start',
  },
  dateButtonLabel: {
    color: '#21281B',
    fontWeight: '500',
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    marginTop: -6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});
