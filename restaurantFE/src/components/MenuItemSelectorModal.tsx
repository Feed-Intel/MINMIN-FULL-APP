import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  Checkbox,
  List,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import ModalHeader from "./ModalHeader";
import { MenuType } from "@/types/menuType";

type MenuItemSelectorModalProps = {
  title: string;
  visible: boolean;
  menus: MenuType[];
  selectedIds: string[];
  disabledIds?: string[];
  onApply: (ids: string[]) => void;
  onClose: () => void;
  multiSelect?: boolean;
};

const MenuItemSelectorModal: React.FC<MenuItemSelectorModalProps> = ({
  title,
  visible,
  menus,
  selectedIds,
  disabledIds = [],
  onApply,
  onClose,
  multiSelect = true,
}) => {
  const [search, setSearch] = useState("");
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds);

  const getCategories = (menu: MenuType): string[] => {
    if (Array.isArray(menu.categories) && menu.categories.length) {
      return menu.categories;
    }
    if (menu.category) {
      return [menu.category];
    }
    return [];
  };

  useEffect(() => {
    if (visible) {
      const initial = selectedIds ?? [];
      setLocalSelection(multiSelect ? initial : initial.slice(0, 1));
      setSearch("");
    }
  }, [selectedIds, visible, multiSelect]);

  const availableMenus = useMemo(() => {
    return menus.filter((menu) => {
      const id = menu.id ?? "";
      return id && !disabledIds.includes(id);
    });
  }, [menus, disabledIds]);

  const filteredMenus = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return availableMenus;
    return availableMenus.filter((menu) => {
      const code = (menu as any)?.code || (menu as any)?.menu_code;
      const price = menu.price ? menu.price.toString() : "";
      const categoriesText = getCategories(menu).join(" ");
      return [menu.name, code, price, categoriesText]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(term));
    });
  }, [availableMenus, search]);

  const toggleSelection = (id: string) => {
    setLocalSelection((prev) => {
      if (multiSelect) {
        return prev.includes(id)
          ? prev.filter((value) => value !== id)
          : [...prev, id];
      }
      return prev.includes(id) ? [] : [id];
    });
  };

  const renderItem = ({ item }: { item: MenuType }) => {
    const id = item.id ?? "";
    const checked = localSelection.includes(id);
    const code = (item as any)?.code || (item as any)?.menu_code;
    const price = item.price ? `Price: ${item.price}` : undefined;
    const categories = getCategories(item);
    const categoryText = categories.length
      ? `Categories: ${categories.join(", ")}`
      : undefined;
    const description = [code && `Code: ${code}`, price, categoryText]
      .filter(Boolean)
      .join("  •  ");

    return (
      <List.Item
        key={id}
        title={item.name}
        description={description}
        onPress={() => toggleSelection(id)}
        right={() =>
          multiSelect ? (
            <Checkbox
              status={checked ? "checked" : "unchecked"}
              onPress={() => toggleSelection(id)}
            />
          ) : (
            <RadioButton
              value={id}
              status={checked ? "checked" : "unchecked"}
              onPress={() => toggleSelection(id)}
            />
          )
        }
      />
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <Card.Title title={<ModalHeader title={title} onClose={onClose} />} />
          <Card.Content style={styles.cardContent}>
            <TextInput
              mode="outlined"
              placeholder="Search menu items"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              left={<TextInput.Icon icon="magnify" />}
            />
            {filteredMenus.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No menu items found</Text>
              </View>
            ) : (
              <FlatList
                data={filteredMenus}
                keyExtractor={(item) => item.id ?? ""}
                renderItem={renderItem}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </Card.Content>
          <Card.Actions style={styles.actions}>
            <Button onPress={onClose}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => {
                onApply(
                  multiSelect ? localSelection : localSelection.slice(0, 1)
                );
                onClose();
              }}
            >
              Apply
            </Button>
          </Card.Actions>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: "90%",
    maxWidth: 520,
    maxHeight: "80vh",
  },
  cardContent: {
    paddingBottom: 0,
  },
  searchInput: {
    marginBottom: 16,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    color: "#6A6A6A",
  },
  actions: {
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

export default MenuItemSelectorModal;
