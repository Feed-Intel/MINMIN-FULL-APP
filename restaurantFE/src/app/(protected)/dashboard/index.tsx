// src/components/Dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Portal, Dialog, Button, Menu } from 'react-native-paper';

import { useDashboardData, useTopMenuItems } from '@/services/mutation/tenantMutation';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';

const screenWidth = Dimensions.get('window').width;

type DashboardPeriod = 'today' | 'month' | 'year';

type MetricDefinition = {
  id: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  accessor: (data: any) => number | string | undefined;
  getTitle: (period: DashboardPeriod) => string;
  formatValue: (value: any) => string;
  getSubtitle?: (data: any) => string | undefined;
};

type MetricDisplay = {
  id: string;
  title: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  subtitle?: string;
  rawValue?: any;
};

const formatCurrency = (value: number | string | undefined) => {
  if (value === null || value === undefined) return 'ETB 0';
  const numeric = Number(value) || 0;
  return `ETB ${numeric.toLocaleString()}`;
};

const formatNumber = (value: number | string | undefined) => {
  if (value === null || value === undefined) return '0';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toLocaleString();
};

const getPeriodDescriptor = (period: DashboardPeriod, base: string) => {
  switch (period) {
    case 'today':
      return `Today's ${base}`;
    case 'month':
      return `This Month's ${base}`;
    case 'year':
    default:
      return `This Year's ${base}`;
  }
};

const DEFAULT_METRICS: MetricDefinition[] = [
  {
    id: 'revenue',
    icon: 'cash-outline',
    accessor: (data) => data?.revenue,
    getTitle: (period) => getPeriodDescriptor(period, 'Revenue'),
    formatValue: (value) => formatCurrency(value),
    getSubtitle: (data) =>
      data?.revenue_change !== undefined
        ? `${data.revenue_change > 0 ? '+' : ''}${data.revenue_change}% vs prior` 
        : undefined,
  },
  {
    id: 'orders',
    icon: 'receipt-outline',
    accessor: (data) => data?.orders,
    getTitle: (period) =>
      period === 'today'
        ? 'Total Orders Today'
        : period === 'month'
        ? 'Total Orders This Month'
        : 'Total Orders This Year',
    formatValue: (value) => formatNumber(value),
  },
  {
    id: 'active_tables',
    icon: 'restaurant-outline',
    accessor: (data) => data?.active_tables,
    getTitle: () => 'Active Tables',
    formatValue: (value) => formatNumber(value),
  },
  {
    id: 'rating',
    icon: 'star',
    iconColor: '#FFD700',
    accessor: (data) => data?.rating,
    getTitle: () => 'Customer Rating',
    formatValue: (value) => {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return '0.0';
      return numeric.toFixed(1);
    },
    getSubtitle: () => 'Average review score',
  },
];

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState<'today' | 'month' | 'year'>('today');
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [branchMenuVisible, setBranchMenuVisible] = useState(false);

  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();
  const { data: branches } = useGetBranches();

  const [selectedBranch, setSelectedBranch] = useState<string>(
    isRestaurant ? 'all' : branchId ?? ''
  );

  useEffect(() => {
    if (isBranch && branchId) {
      setSelectedBranch(branchId);
    }
  }, [isBranch, branchId]);

  useEffect(() => {
    if (isRestaurant) {
      // Reset selection if the currently selected branch is no longer available
      const hasSelectedBranch = branches?.some(
        (branch) => branch.id === selectedBranch
      );

      if (selectedBranch !== 'all' && !hasSelectedBranch) {
        setSelectedBranch('all');
      }
    }
  }, [isRestaurant, branches, selectedBranch]);

  const branchQueryParam = useMemo(() => {
    if (isBranch) {
      return branchId ?? undefined;
    }

    if (isRestaurant) {
      return selectedBranch === 'all' ? undefined : selectedBranch;
    }

    return undefined;
  }, [isBranch, isRestaurant, branchId, selectedBranch]);

  const dashboardParams = useMemo(() => {
    if (startDate && endDate) {
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (branchQueryParam) params.branch_id = branchQueryParam;
      return params;
    }

    const params: Record<string, string> = { period: selectedTab };
    if (branchQueryParam) params.branch_id = branchQueryParam;
    return params;
  }, [branchQueryParam, endDate, selectedTab, startDate]);

  const topMenuParams = useMemo(() => {
    const params: Record<string, string> = startDate && endDate
      ? { start_date: startDate, end_date: endDate }
      : {
          start_date: moment().format('YYYY-MM-DD'),
          end_date: moment().format('YYYY-MM-DD'),
        };

    if (branchQueryParam) params.branch_id = branchQueryParam;
    return params;
  }, [branchQueryParam, startDate, endDate]);

  // Fetch data based on selected tab or date range
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading, 
    isError: isDashboardError,
    refetch: refetchDashboard
  } = useDashboardData(dashboardParams);

  const { 
    data: topItemsData,
    isLoading: isTopItemsLoading,
    isError: isTopItemsError
  } = useTopMenuItems(topMenuParams);

  const selectedBranchLabel = useMemo(() => {
    if (isBranch) {
      const branch = branches?.find((item) => item.id === branchId);
      return branch?.address ?? 'My Branch';
    }

    if (isRestaurant) {
      if (selectedBranch === 'all') return 'All Branches';
      const branch = branches?.find((item) => item.id === selectedBranch);
      return branch?.address ?? 'Selected Branch';
    }

    return 'All Branches';
  }, [isBranch, isRestaurant, branches, branchId, selectedBranch]);

  // Generate chart data from API response
  const getChartData = () => {
    if (!dashboardData || !topItemsData) return null;

    return {
      revenueData: {
        labels: dashboardData.chart_data?.labels || [],
        datasets: [{
          data: dashboardData.chart_data?.data || [],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 2
        }]
      },
      itemsData: {
        labels: topItemsData?.map((item: any) => item.name) || ['Loading...'],
        datasets: [{
          data: topItemsData?.map((item: any) => item.count) || [0]
        }]
      }
    };
  };

  const chartData = getChartData();

  // Format card data from API response
  const metrics: MetricDisplay[] = useMemo(() => {
    if (
      dashboardData?.metrics &&
      Array.isArray(dashboardData.metrics) &&
      dashboardData.metrics.length
    ) {
      return dashboardData.metrics.map((metric: any, index: number) => ({
        id: metric.id || metric.key || `metric-${index}`,
        title: metric.title || metric.label || `Metric ${index + 1}`,
        value:
          metric.display_value ??
          (metric.unit === 'currency'
            ? formatCurrency(metric.value)
            : metric.unit === 'percent'
            ? `${metric.value ?? 0}%`
            : formatNumber(metric.value ?? metric.amount ?? 0)),
        subtitle: metric.subtitle || metric.description,
        icon: (metric.icon as keyof typeof Ionicons.glyphMap) || 'stats-chart-outline',
        iconColor: metric.iconColor || metric.icon_color || '#91B275',
        rawValue: metric.value ?? metric.amount,
      }));
    }

    return DEFAULT_METRICS.map((definition) => {
      const rawValue = definition.accessor(dashboardData);
      return {
        id: definition.id,
        title: definition.getTitle(selectedTab),
        value: definition.formatValue(rawValue),
        subtitle: definition.getSubtitle?.(dashboardData),
        icon: definition.icon,
        iconColor: definition.iconColor,
        rawValue,
      };
    });
  }, [dashboardData, selectedTab]);

  const primaryMetric = useMemo(() => {
    if (!metrics.length) return undefined;
    return metrics.find((metric) => metric.id === 'revenue') || metrics[0];
  }, [metrics]);

  // Calendar theme
  const calendarTheme = {
    backgroundColor: '#ffffff',
    calendarBackground: '#ffffff',
    textSectionTitleColor: '#4CAF50',
    selectedDayBackgroundColor: '#4CAF50',
    selectedDayTextColor: '#ffffff',
    todayTextColor: '#4CAF50',
    dayTextColor: '#2d4150',
    textDisabledColor: '#d9e1e8',
    dotColor: '#4CAF50',
    selectedDotColor: '#ffffff',
    arrowColor: '#4CAF50',
    monthTextColor: '#4CAF50',
    indicatorColor: '#4CAF50',
    textDayFontFamily: 'monospace',
    textMonthFontFamily: 'monospace',
    textDayHeaderFontFamily: 'monospace',
    textDayFontWeight: '300',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: '300',
    textDayFontSize: 14,
    textMonthFontSize: 16,
    textDayHeaderFontSize: 14
  };

  const handleDayPress = (day: any) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day.dateString);
      setEndDate(null);
    } else {
      if (moment(day.dateString).isBefore(moment(startDate))) {
        setEndDate(startDate);
        setStartDate(day.dateString);
      } else {
        setEndDate(day.dateString);
      }
    }
  };

  const getMarkedDates = () => {
    let markedDates = {};
    
    if (startDate) {
      markedDates[startDate] = {
        startingDay: true,
        color: '#4CAF50',
        textColor: 'white'
      };
    }
    
    if (endDate) {
      markedDates[endDate] = {
        endingDay: true,
        color: '#4CAF50',
        textColor: 'white'
      };
      
      let current = moment(startDate).add(1, 'day');
      while (current.isBefore(moment(endDate))) {
        const dateStr = current.format('YYYY-MM-DD');
        markedDates[dateStr] = {
          color: '#A5D6A7',
          textColor: 'black'
        };
        current.add(1, 'day');
      }
    } else if (startDate) {
      markedDates[startDate] = {
        selected: true,
        color: '#4CAF50',
        textColor: 'white'
      };
    }
    
    return markedDates;
  };

  const applyDateRange = () => {
    if (startDate && endDate) {
      refetchDashboard();
      setDateFilterVisible(false);
    } else if (startDate) {
      setSelectedTab('today');
      setDateFilterVisible(false);
    }
  };

  const resetDateRange = () => {
    setStartDate(null);
    setEndDate(null);
  };

  if (isDashboardLoading || isTopItemsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  if (isDashboardError || isTopItemsError || !chartData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#FF5252" />
        <Text style={styles.errorText}>Error loading dashboard data</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            refetchDashboard();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Dashboard</Text>
        {isRestaurant ? (
          <Menu
            visible={branchMenuVisible}
            onDismiss={() => setBranchMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.branchSelector}
                onPress={() => setBranchMenuVisible(true)}
              >
                <Text style={styles.branchText}>{selectedBranchLabel}</Text>
                <Ionicons name="chevron-down" size={16} color="#5E6E49" />
              </TouchableOpacity>
            }
            contentStyle={styles.branchMenu}
          >
            <Menu.Item
              onPress={() => {
                setSelectedBranch('all');
                setBranchMenuVisible(false);
              }}
              title="All Branches"
            />
            {branches?.map((branch) => (
              <Menu.Item
                key={branch.id}
                onPress={() => {
                  setSelectedBranch(branch.id!);
                  setBranchMenuVisible(false);
                }}
                title={branch.address}
              />
            ))}
          </Menu>
        ) : (
          <View style={styles.branchPill}>
            <Text style={styles.branchText}>{selectedBranchLabel}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'today' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('today');
            setStartDate(null);
            setEndDate(null);
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'today' && styles.activeTabText]}>Today</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'month' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('month');
            setStartDate(null);
            setEndDate(null);
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'month' && styles.activeTabText]}>This Month</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'year' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('year');
            setStartDate(null);
            setEndDate(null);
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'year' && styles.activeTabText]}>This Year</Text>
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <View style={styles.cardsRow}>
        {metrics.map((metric) => (
          <View key={metric.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{metric.title}</Text>
              <Ionicons name="ellipsis-vertical" size={16} color="#888" />
            </View>
            {metric.subtitle ? (
              <Text style={styles.cardSubtitle}>{metric.subtitle}</Text>
            ) : null}
            <View style={styles.metricValueRow}>
              <Text style={styles.cardValue}>{metric.value}</Text>
              {metric.icon ? (
                <Ionicons
                  name={metric.icon}
                  size={18}
                  color={metric.iconColor || '#91B275'}
                  style={styles.metricIcon}
                />
              ) : null}
            </View>
          </View>
        ))}
      </View>

      {/* Date Filter */}
      <TouchableOpacity 
        style={styles.dateFilter} 
        onPress={() => setDateFilterVisible(true)}
      >
        <View style={styles.dateFilterInner}>
          <Ionicons name="calendar" size={20} color="#222C169E" />
          <Text style={styles.dateFilterText}>
            {startDate && endDate 
              ? `${moment(startDate).format('MMM D')} - ${moment(endDate).format('MMM D, YYYY')}`
              : 'Date Filter'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#222C169E" />
      </TouchableOpacity>

      {/* Charts Row - Side by Side */}
      <View style={styles.chartsRow}>
        {/* Revenue Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Revenue</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={16} color="#888" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.revenueContainer}>
            <Text style={styles.revenueValue}>{primaryMetric?.value ?? 'ETB 0'}</Text>
            <Text style={styles.revenueChange}>
              {dashboardData?.revenue_change !== undefined
                ? `${dashboardData.revenue_change > 0 ? '+' : ''}${dashboardData.revenue_change}%`
                : 'N/A'}
            </Text>
          </View>
          
          <LineChart
            data={chartData.revenueData}
            width={screenWidth * 0.38}
            height={200}
            withDots={false}
            withVerticalLines={false}
            chartConfig={{
              backgroundGradientFrom: "#546D3617",
              backgroundGradientTo: "#546D3617",
              fillShadowGradientFrom: "#96B76E",
              fillShadowGradientFromOpacity: 0.5,
              fillShadowGradientTo: "#96B76E",
              fillShadowGradientToOpacity: 0,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            style={styles.chartStyle}
          />
        </View>

        {/* Most Ordered Items */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Most Ordered</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={16} color="#888" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.subtitle}>
            {topItemsData?.length ? `Top item: ${topItemsData[0].name}` : 'No data available'}
          </Text>
          
          <BarChart
            data={chartData.itemsData}
            width={screenWidth * 0.37}
            height={200}
            fromZero
            showValuesOnTopOfBars
            withHorizontalLabels={false}
            chartConfig={{
              backgroundGradientFrom: "#546D3617",
              backgroundGradientTo: "#546D3617",
              fillShadowGradientFrom: "#96B76E",
              fillShadowGradientFromOpacity: 0,
              fillShadowGradientTo: "#96B76E",
              fillShadowGradientToOpacity: 0,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              barPercentage: 0.6,
              propsForBackgroundLines: {
                strokeDasharray: ""
              }
            }}
            style={styles.chartStyle}
            verticalLabelRotation={0}
          />
        </View>
      </View>

      {/* Calendar Dialog */}
      <Portal>
        <Dialog 
          visible={dateFilterVisible} 
          onDismiss={() => setDateFilterVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Select Date Range</Dialog.Title>
          <Dialog.Content>
            <Calendar
              theme={calendarTheme}
              current={startDate || moment().format('YYYY-MM-DD')}
              minDate={'2020-01-01'}
              maxDate={moment().format('YYYY-MM-DD')}
              onDayPress={handleDayPress}
              markingType="period"
              markedDates={getMarkedDates()}
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={resetDateRange}
              textColor="#4CAF50"
              style={styles.dialogButton}
            >
              Reset
            </Button>
            <Button 
              onPress={() => setDateFilterVisible(false)}
              textColor="#FF5252"
              style={styles.dialogButton}
            >
              Cancel
            </Button>
            <Button 
              onPress={applyDateRange}
              textColor="#4CAF50"
              style={styles.dialogButton}
              disabled={!startDate}
            >
              Apply
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#EFF4EB' 
  },
  contentContainer: {
    padding: 16,
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 16
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#21281B' 
  },
  branchSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5E6E4933',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  branchPill: {
    borderWidth: 1,
    borderColor: '#5E6E4933',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  branchMenu: {
    width: 220,
  },
  branchText: {
    color: '#21281B',
    marginRight: 6,
    fontWeight: '500',
  },
  tabsContainer: { 
    flexDirection: 'row', 
    marginBottom: 16,
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#5E6E4933',
  },
  tab: { 
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8
  },
  activeTab: { 
    borderBottomWidth: 2,
    borderColor: '#668442', 
  },
  tabText: { 
    color: '#222C169E', 
    fontSize: 14 
  },
  activeTabText: { 
    color: '#668442',
    fontWeight: '500' 
  },
  cardsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginBottom: 16
  },
  card: { 
    backgroundColor: '#5A6E4933', 
    width: '23.5%', 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 12,
    borderColor: '#5E6E4933',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: { 
    fontSize: 17, 
    color: '#21281B',
    fontWeight: '500'
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#4A4A4A',
    marginBottom: 6,
  },
  cardValue: { 
    fontSize: 34, 
    fontWeight: 'bold', 
    color: '#21281B',
    marginTop: 4
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricIcon: {
    marginLeft: 8,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#546D3617',
    padding: 16,
    borderRadius: 12,
    borderColor: '#5E6E4933',
    borderWidth: 1,
    marginBottom: 16,
  },
  dateFilterInner: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateFilterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#21281B',
    marginLeft: 8
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  chartCard: {
    backgroundColor: '#546D3617',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }
      : {
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  chartTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#21281B'
  },
  revenueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  revenueValue: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#21281B',
    marginRight: 8
  },
  revenueChange: {
    fontSize: 14,
    color: '#FF5252'
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16
  },
  chartStyle: {
    borderRadius: 8,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    alignSelf: 'center',
  },
  dialogTitle: {
    color: '#21281B',
    fontWeight: 'bold',
  },
  dialogActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dialogButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF4EB',
  },
  loadingText: {
    marginTop: 16,
    color: '#668442',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF4EB',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#FF5252',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Dashboard;
