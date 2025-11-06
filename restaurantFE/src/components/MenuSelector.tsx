import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { Menu, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const SelectItemMenu = ({
  onSelectColor,
  OPTIONS,
  placeholder,
}: {
  onSelectColor: (arg0: string) => void;
  OPTIONS: { value: string; label: string }[];
  placeholder: string;
}) => {
  const [visible, setVisible] = useState(false);
  const [selectedItemLabel, setSelectedItemLabel] = useState<string | null>(
    null
  );

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSelect = (item: { value: string; label: string }) => {
    setSelectedItemLabel(item.label);
    if (onSelectColor) {
      onSelectColor(item.value);
    }
    closeMenu();
  };

  return (
    <View style={styles.container}>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Pressable onPress={openMenu} style={styles.filterMenu}>
            <Text
              style={
                selectedItemLabel ? styles.selectedText : styles.placeholderText
              }
              numberOfLines={1}
            >
              {selectedItemLabel || placeholder}
            </Text>
            <Ionicons
              name={visible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#2E3A24"
            />
          </Pressable>
        }
      >
        {OPTIONS.map((item) => (
          <Menu.Item
            key={item.value}
            onPress={() => handleSelect(item)}
            title={item.label}
            titleStyle={styles.menuItemText}
            style={{
              backgroundColor:
                selectedItemLabel === item.label ? '#91B27530' : 'transparent',
            }}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  filterMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 200,
    paddingHorizontal: 12,
    height: 50,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#C7D3C1',
    borderRadius: 10,
    backgroundColor: '#91B27517',
  },
  selectedText: {
    fontSize: 16,
    color: '#2E3A24',
  },
  placeholderText: {
    fontSize: 16,
    color: '#2E3A2499',
  },
  menuItemText: {
    color: '#2E3A24',
  },
});

export default SelectItemMenu;
