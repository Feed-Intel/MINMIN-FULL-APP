import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Button, Menu, Text } from 'react-native-paper';

import { useRestaurantIdentity } from '@/hooks/useRestaurantIdentity';
import { useGetBranches } from '@/services/mutation/branchMutation';
import { i18n as I18n } from '@/app/_layout';

type Props = {
  selectedBranch: string | null;
  onChange: (branchId: string) => void;
  includeAllOption?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
};

const BranchSelector: React.FC<Props> = ({
  selectedBranch,
  onChange,
  includeAllOption = true,
  style,
  label = I18n.t('branch_selector.label_branch'), // Replaced static default 'Branch'
}) => {
  const { isRestaurant, isBranch, branchId } = useRestaurantIdentity();
  const { data: branches, isLoading } = useGetBranches(undefined, true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    if (isBranch && branchId && selectedBranch !== branchId) {
      onChange(branchId);
    }
  }, [isBranch, branchId, selectedBranch, onChange]);

  useEffect(() => {
    if (!isRestaurant || !branches?.results.length) return;

    if (!selectedBranch) {
      if (includeAllOption) {
        onChange('all');
      } else {
        onChange(branches.results[0].id!);
      }
    }
  }, [branches, includeAllOption, isRestaurant, onChange, selectedBranch]);

  const currentLabel = useMemo(() => {
    if (isBranch) {
      const branch = branches?.results?.find((b) => b.id === branchId);
      // Replaced static 'My Branch'
      return branch?.address ?? I18n.t('branch_selector.my_branch');
    }

    if (selectedBranch === 'all') {
      // Replaced static 'All Branches'
      return I18n.t('branch_selector.all_branches');
    }

    const branch = branches?.results.find((b) => b.id === selectedBranch);
    return (
      branch?.address ??
      // Replaced static 'Loading...' and 'Select Branch'
      (isLoading
        ? I18n.t('branch_selector.loading')
        : I18n.t('branch_selector.select_branch'))
    );
  }, [branches, branchId, isBranch, isLoading, selectedBranch]);

  if (isBranch) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{currentLabel}</Text>
        </View>
      </View>
    );
  }

  if (!branches?.results.length && !isLoading) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setMenuVisible(true)}
            style={styles.dropdownButton}
            labelStyle={styles.dropdownLabel}
            contentStyle={styles.dropdownContent}
            icon={menuVisible ? 'chevron-up' : 'chevron-down'}
            disabled={isLoading}
          >
            {currentLabel}
          </Button>
        }
        contentStyle={styles.menuContent}
      >
        {includeAllOption && (
          <Menu.Item
            // Replaced static 'All Branches'
            title={I18n.t('branch_selector.all_branches')}
            onPress={() => {
              onChange('all');
              setMenuVisible(false);
            }}
            titleStyle={styles.contentStyle}
          />
        )}
        {branches?.results.map((branch) => (
          <Menu.Item
            key={branch.id}
            title={branch.address}
            onPress={() => {
              onChange(branch.id!);
              setMenuVisible(false);
            }}
            titleStyle={styles.contentStyle}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#5F7A3D',
    fontWeight: '500',
    marginBottom: 6,
  },
  pill: {
    backgroundColor: '#EFF4EB',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  pillText: {
    color: '#21281B',
    fontWeight: '500',
  },
  dropdownButton: {
    borderColor: '#5E6E4933',
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'flex-start',
    backgroundColor: '#91B27517',
  },
  dropdownLabel: {
    color: '#21281B',
    fontWeight: '500',
  },
  dropdownContent: {
    flexDirection: 'row-reverse',
  },
  menuContent: {
    backgroundColor: '#FFFFFF',
  },
  contentStyle: {
    color: '#000000',
  },
});

export default BranchSelector;
