import dayjs from "dayjs";
import DatePicker from "@/components/DatePicker";
import { Branch } from "@/types/branchType";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateDiscountRule,
  useUpdateDiscount,
  useUpdateDiscountRule,
} from "@/services/mutation/discountMutation";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import {
  Button,
  Dialog,
  HelperText,
  Menu,
  Portal,
  Switch,
  Text,
  TextInput as PaperTextInput,
} from "react-native-paper";
import {
  ScrollView,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useGetMenus } from "@/services/mutation/menuMutation";
import MenuItemSelectorModal from "./MenuItemSelectorModal";
import ModalHeader from "./ModalHeader";

const TYPEOPTIONS = [
  { label: "Volume", value: "volume" },
  { label: "Combo", value: "combo" },
  { label: "BOGO", value: "bogo" },
  { label: "Free Item", value: "freeItem" },
];

const ruleDefaultState = {
  min_items: "",
  max_items: "",
  min_price: "",
  applicable_items: [] as string[],
  excluded_items: [] as string[],
  combo_size: "",
  buy_quantity: "",
  get_quantity: "",
  is_percentage: false,
  max_discount_amount: "",
};

type EditDiscountModalProps = {
  branches: Branch[];
  discount: any;
  discountRule: any | null;
  visible: boolean;
  onClose: () => void;
};

export default function EditDiscountModal({
  branches,
  discount,
  discountRule,
  visible,
  onClose,
}: EditDiscountModalProps) {
  const [branch, setBranch] = useState<string>(discount.branch?.id);
  const [name, setName] = useState(discount.name);
  const [description, setDescription] = useState(discount.description);
  const [type, setType] = useState(discount.type);
  const [showType, setShowType] = useState(false);
  const [off_peak_hours, setOffPeakHours] = useState(discount.off_peak_hours);
  const [priority, setPriority] = useState<string | undefined>(
    discount.priority
  );
  const [stackable, setStackable] = useState(discount.is_stackable);
  const [valid_from, setValidFrom] = useState<Date | undefined>(
    new Date(discount.valid_from)
  );
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [valid_until, setValidUntil] = useState<Date | undefined>(
    new Date(discount.valid_until)
  );
  const [showUntilPicker, setShowUntilPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [ruleFormValues, setRuleFormValues] = useState({
    ...ruleDefaultState,
    min_items: discountRule?.min_items?.toString() ?? "",
    max_items: discountRule?.max_items?.toString() ?? "",
    min_price: discountRule?.min_price?.toString() ?? "",
    applicable_items: Array.isArray(discountRule?.applicable_items)
      ? discountRule?.applicable_items
      : discountRule?.applicable_items
      ? [discountRule.applicable_items]
      : [],
    excluded_items: Array.isArray(discountRule?.excluded_items)
      ? discountRule?.excluded_items
      : discountRule?.excluded_items
      ? [discountRule.excluded_items]
      : [],
    combo_size: discountRule?.combo_size?.toString() ?? "",
    buy_quantity: discountRule?.buy_quantity?.toString() ?? "",
    get_quantity: discountRule?.get_quantity?.toString() ?? "",
    is_percentage: Boolean(discountRule?.is_percentage),
    max_discount_amount: discountRule?.max_discount_amount?.toString() ?? "",
  });
  const [ruleErrors, setRuleErrors] = useState<{ [key: string]: string }>({});
  const [applicableSelectorVisible, setApplicableSelectorVisible] =
    useState(false);
  const [excludedSelectorVisible, setExcludedSelectorVisible] =
    useState(false);

  const { mutateAsync: updateDiscount } = useUpdateDiscount();
  const { mutateAsync: updateDiscountRule } = useUpdateDiscountRule();
  const { mutateAsync: createDiscountRule } = useCreateDiscountRule();
  const { data: menus = [] } = useGetMenus();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!visible) {
      resetRuleErrors();
    }
  }, [visible]);

  useEffect(() => {
    resetRuleErrors();
  }, [type]);

  const resetRuleErrors = () => setRuleErrors({});

  const getMenuSummary = (ids: string[] = []) => {
    if (!ids?.length) {
      return "";
    }

    const names = ids
      .map((id) => menus.find((mn) => mn.id === id)?.name)
      .filter(Boolean) as string[];

    if (!names.length) {
      return `${ids.length} selected`;
    }

    if (names.length <= 2) {
      return names.join(", ");
    }

    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  };

  const clearRuleError = (field: string) => {
    setRuleErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const validateForm = () => {
    if (!branch) {
      Toast.show({
        type: "error",
        text1: "Branch selection is required.",
        text2: "Please select branch.",
      });
      return false;
    }

    if (!name?.trim()) {
      Toast.show({ type: "error", text1: "Name is required." });
      return false;
    }

    if (name.trim().length < 3) {
      Toast.show({
        type: "error",
        text1: "Name must be at least 3 characters long.",
      });
      return false;
    }

    if (!type) {
      Toast.show({ type: "error", text1: "Discount type is required." });
      return false;
    }

    if (priority !== undefined && priority !== "") {
      if (isNaN(Number(priority)) || Number(priority) < 0) {
        Toast.show({
          type: "error",
          text1: "Priority must be a non-negative number.",
        });
        return false;
      }
    }

    if (!valid_from) {
      Toast.show({ type: "error", text1: "Valid from date is required." });
      return false;
    }

    if (!valid_until) {
      Toast.show({ type: "error", text1: "Valid until date is required." });
      return false;
    }

    if (valid_from && valid_until && dayjs(valid_until).isBefore(valid_from)) {
      Toast.show({
        type: "error",
        text1: "Valid until must be after valid from.",
      });
      return false;
    }

    return true;
  };

  const handleRuleFormChange = (
    key: string,
    value: string | boolean | string[]
  ) => {
    const normalizedValue =
      key === "applicable_items" || key === "excluded_items"
        ? Array.isArray(value)
          ? value
          : value == null || value === ""
          ? []
          : [value]
        : value;

    setRuleFormValues((prev) => {
      if (key === "applicable_items") {
        const values = normalizedValue as string[];
        return {
          ...prev,
          applicable_items: values,
          excluded_items: (prev.excluded_items || []).filter(
            (id) => !values.includes(id)
          ),
        };
      }

      if (key === "excluded_items") {
        const values = normalizedValue as string[];
        return {
          ...prev,
          excluded_items: values,
          applicable_items: (prev.applicable_items || []).filter(
            (id) => !values.includes(id)
          ),
        };
      }

      return {
        ...prev,
        [key]: normalizedValue,
      };
    });
  };

  const handleApplicableApply = (ids: string[]) => {
    handleRuleFormChange("applicable_items", ids);
    clearRuleError("applicable_items");
  };

  const handleExcludedApply = (ids: string[]) => {
    handleRuleFormChange("excluded_items", ids);
    clearRuleError("excluded_items");
  };

  const validateRuleForm = () => {
    const errors: { [key: string]: string } = {};

    if (!type) {
      errors.type = "Select a discount type before configuring rules.";
    }

    if (
      type === "volume" &&
      (!ruleFormValues.min_items || isNaN(Number(ruleFormValues.min_items)))
    ) {
      errors.min_items = "Min items must be a valid number.";
    } else if (type === "volume" && Number(ruleFormValues.min_items) <= 0) {
      errors.min_items = "Min items must be greater than 0.";
    }

    const requiresQuantity = type === "bogo" || type === "freeItem";

    if (
      requiresQuantity &&
      (!ruleFormValues.buy_quantity ||
        isNaN(Number(ruleFormValues.buy_quantity)))
    ) {
      errors.buy_quantity = "Buy quantity must be a valid number.";
    } else if (
      requiresQuantity &&
      Number(ruleFormValues.buy_quantity) <= 0
    ) {
      errors.buy_quantity = "Buy quantity must be greater than 0.";
    }

    if (
      requiresQuantity &&
      (!ruleFormValues.get_quantity ||
        isNaN(Number(ruleFormValues.get_quantity)))
    ) {
      errors.get_quantity = "Get quantity must be a valid number.";
    } else if (
      requiresQuantity &&
      Number(ruleFormValues.get_quantity) <= 0
    ) {
      errors.get_quantity = "Get quantity must be greater than 0.";
    }

    if (
      type !== "bogo" &&
      type !== "freeItem" &&
      (!ruleFormValues.max_discount_amount ||
        isNaN(Number(ruleFormValues.max_discount_amount)))
    ) {
      errors.max_discount_amount =
        "Max discount amount must be a valid number.";
    } else if (
      ruleFormValues.max_discount_amount !== "" &&
      Number(ruleFormValues.max_discount_amount) < 0
    ) {
      errors.max_discount_amount =
        "Max discount amount must be non-negative.";
    }

    if (
      requiresQuantity &&
      (!ruleFormValues.applicable_items ||
        ruleFormValues.applicable_items.length === 0)
    ) {
      errors.applicable_items = "Select at least one applicable item.";
    }

    if (
      ruleFormValues.excluded_items?.some((item) =>
        ruleFormValues.applicable_items.includes(item)
      )
    ) {
      errors.excluded_items =
        "Excluded items cannot overlap with applicable items.";
    }

    setRuleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildRulePayload = () => {
    const toNumber = (value: string) =>
      value === undefined || value === null || value === ""
        ? undefined
        : Number(value);

    return {
      discount_id: discount.id,
      min_items: toNumber(ruleFormValues.min_items),
      max_items: toNumber(ruleFormValues.max_items),
      min_price: toNumber(ruleFormValues.min_price),
      applicable_items: ruleFormValues.applicable_items,
      excluded_items: ruleFormValues.excluded_items,
      combo_size: toNumber(ruleFormValues.combo_size),
      buy_quantity: toNumber(ruleFormValues.buy_quantity),
      get_quantity: toNumber(ruleFormValues.get_quantity),
      is_percentage: ruleFormValues.is_percentage,
      max_discount_amount: toNumber(ruleFormValues.max_discount_amount),
    };
  };

  const handleSubmit = async () => {
    if (!validateForm() || !validateRuleForm()) {
      return;
    }

    try {
      const discountPayload: any = {
        id: discount.id,
        branch: branch,
        name: name,
        description: description,
        type: type,
        off_peak_hours: off_peak_hours,
        priority: priority,
        is_stackable: stackable,
        valid_from: valid_from,
        valid_until: valid_until,
      };

      await updateDiscount(discountPayload);
      await queryClient.invalidateQueries({ queryKey: ["discounts"] });

      const rulePayload = buildRulePayload();

      if (discountRule?.id) {
        await updateDiscountRule({ ...rulePayload, id: discountRule.id });
      } else {
        await createDiscountRule(rulePayload);
      }

      await queryClient.invalidateQueries({ queryKey: ["discountRules"] });
      onClose();
    } catch (error) {
      console.error("Error updating discount", error);
      Toast.show({
        type: "error",
        text1: "Failed to update discount",
        text2: "Please try again.",
      });
    }
  };

  const availableMenus = useMemo(
    () =>
      menus.map((mn: any) => ({
        label: mn.name,
        value: mn.id,
      })),
    [menus]
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose} style={stylesModal.dialog}>
        <Dialog.Title>
          <ModalHeader title="Edit Discount" onClose={onClose} />
        </Dialog.Title>
        <Dialog.Content style={stylesModal.content}>
          <ScrollView
            style={stylesModal.scroll}
            contentContainerStyle={stylesModal.scrollContent}
            showsVerticalScrollIndicator
          >
            <Menu
              visible={showMenu}
              onDismiss={() => setShowMenu(false)}
              anchor={
                <View>
                  <Text style={stylesModal.fieldLabel}>Branch</Text>
                  <Button
                    mode="outlined"
                    style={stylesModal.dropdownBtn}
                    labelStyle={{
                      color: branch === "" ? "#aaa" : "#333",
                      fontSize: 14,
                      width: "100%",
                      textAlign: "left",
                      marginLeft: 0,
                    }}
                    onPress={() => setShowMenu(true)}
                    contentStyle={{
                      flexDirection: "row-reverse",
                      width: "100%",
                      paddingLeft: 10,
                    }}
                    icon={showMenu ? "chevron-up" : "chevron-down"}
                  >
                    {branch
                      ? branches.find((b: any) => b.id === branch)?.address
                      : "Branch"}
                  </Button>
                </View>
              }
              contentStyle={[stylesModal.menuContainer, { width: "100%" }]}
              style={{ alignSelf: "stretch" }}
              anchorPosition="bottom"
            >
              {branches.length > 0 ? (
                branches.map((b: any) => (
                  <Menu.Item
                    key={b.id}
                    onPress={() => {
                      setBranch(b.id!);
                      setShowMenu(false);
                    }}
                    title={b.address}
                    titleStyle={stylesModal.menuItem}
                  />
                ))
              ) : (
                <Menu.Item title="No branches available" disabled />
              )}
            </Menu>

            <TextInput
              label="Name"
              placeholder="Name"
              value={name}
              onChangeText={setName}
              style={stylesModal.input}
              placeholderTextColor="#999"
            />

            <TextInput
              label="Description"
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={stylesModal.input}
              keyboardType="default"
              placeholderTextColor="#999"
            />

            <Menu
              visible={showType}
              onDismiss={() => setShowType(false)}
              anchor={
                <View>
                  <Text style={stylesModal.fieldLabel}>Discount type</Text>
                  <Button
                    mode="outlined"
                    style={stylesModal.dropdownBtn}
                    labelStyle={{
                      color: type === "" ? "#aaa" : "#333",
                      fontSize: 14,
                      width: "100%",
                      textAlign: "left",
                      marginLeft: 0,
                    }}
                    onPress={() => setShowType(true)}
                    contentStyle={{
                      flexDirection: "row-reverse",
                      width: "100%",
                      paddingLeft: 10,
                    }}
                    icon={showType ? "chevron-up" : "chevron-down"}
                  >
                    {type
                      ? TYPEOPTIONS.find((option) => option.value === type)?.label
                      : "Discount Type"}
                  </Button>
                </View>
              }
              contentStyle={[stylesModal.menuContainer, { width: "100%" }]}
              style={{ alignSelf: "stretch" }}
              anchorPosition="bottom"
            >
              {TYPEOPTIONS.map((option) => (
                <Menu.Item
                  key={option.value}
                  onPress={() => {
                    setType(option.value);
                    setShowType(false);
                  }}
                  title={option.label}
                  titleStyle={stylesModal.menuItem}
                />
              ))}
            </Menu>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Off peak hours</Text>
              <Switch
                value={off_peak_hours}
                onValueChange={setOffPeakHours}
                color="#91B275"
              />
            </View>

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Stackable</Text>
              <Switch
                value={stackable}
                onValueChange={setStackable}
                color="#91B275"
              />
            </View>

            <TextInput
              label="Priority"
              placeholder="Priority"
              value={priority ?? ""}
              onChangeText={setPriority}
              style={stylesModal.input}
              keyboardType="numeric"
              placeholderTextColor="#999"
            />

            <View style={stylesModal.dateRow}>
              <Text style={stylesModal.fieldLabel}>Valid from</Text>
              <Button
                onPress={() => setShowFromPicker(true)}
                mode="outlined"
                contentStyle={{ flexDirection: "row-reverse" }}
                style={stylesModal.dateButton}
                labelStyle={stylesModal.dateLabel}
                icon="chevron-down"
              >
                Valid From: {valid_from ? dayjs(valid_from).format("YYYY-MM-DD") : "Not set"}
              </Button>
              <DatePicker
                dateFilterVisible={showFromPicker}
                setDateFilterVisible={setShowFromPicker}
                selectedDate={valid_from}
                setSelectedDate={setValidFrom}
              />
            </View>

            <View style={stylesModal.dateRow}>
              <Text style={stylesModal.fieldLabel}>Valid until</Text>
              <Button
                onPress={() => setShowUntilPicker(true)}
                mode="outlined"
                contentStyle={{ flexDirection: "row-reverse" }}
                style={stylesModal.dateButton}
                labelStyle={stylesModal.dateLabel}
                icon="chevron-down"
              >
                Valid Until: {valid_until ? dayjs(valid_until).format("YYYY-MM-DD") : "Not set"}
              </Button>
              <DatePicker
                dateFilterVisible={showUntilPicker}
                setDateFilterVisible={setShowUntilPicker}
                selectedDate={valid_until}
                setSelectedDate={setValidUntil}
              />
            </View>

            <View style={stylesModal.sectionDivider} />

            <Text style={stylesModal.sectionHeader}>Discount Rule</Text>

            {type === "volume" && (
              <>
                <Text style={stylesModal.fieldLabel}>Minimum items</Text>
                <TextInput
                  style={stylesModal.input}
                  keyboardType="numeric"
                  placeholder="Minimum items"
                  value={ruleFormValues.min_items}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      "min_items",
                      value.replace(/[^0-9]/g, "")
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.min_items}>
                  {ruleErrors.min_items}
                </HelperText>
              </>
            )}

            {type !== "bogo" && type !== "freeItem" && (
              <>
                <Text style={stylesModal.fieldLabel}>Max discount amount</Text>
                <TextInput
                  style={stylesModal.input}
                  placeholder="Max discount amount"
                  value={ruleFormValues.max_discount_amount}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      "max_discount_amount",
                      value.replace(/[^0-9.\-]/g, "")
                    )
                  }
                />
                <HelperText
                  type="error"
                  visible={!!ruleErrors.max_discount_amount}
                >
                  {ruleErrors.max_discount_amount}
                </HelperText>
              </>
            )}

            {type === "combo" && (
              <>
                <Text style={stylesModal.fieldLabel}>Combo size</Text>
                <TextInput
                  style={stylesModal.input}
                  placeholder="Combo size"
                  value={ruleFormValues.combo_size}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      "combo_size",
                      value.replace(/[^0-9]/g, "")
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.combo_size}>
                  {ruleErrors.combo_size}
                </HelperText>
              </>
            )}

            {(type === "bogo" || type === "freeItem") && (
              <>
                <TextInput
                  label="Buy quantity"
                  style={stylesModal.input}
                  placeholder="Buy quantity"
                  value={ruleFormValues.buy_quantity}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      "buy_quantity",
                      value.replace(/[^0-9]/g, "")
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.buy_quantity}>
                  {ruleErrors.buy_quantity}
                </HelperText>

                <TextInput
                  label="Get quantity"
                  style={stylesModal.input}
                  placeholder="Get quantity"
                  value={ruleFormValues.get_quantity}
                  onChangeText={(value) =>
                    handleRuleFormChange(
                      "get_quantity",
                      value.replace(/[^0-9]/g, "")
                    )
                  }
                />
                <HelperText type="error" visible={!!ruleErrors.get_quantity}>
                  {ruleErrors.get_quantity}
                </HelperText>

                <Text style={stylesModal.fieldLabel}>Applicable items</Text>
                <TouchableOpacity
                  onPress={() => setApplicableSelectorVisible(true)}
                  activeOpacity={0.85}
                >
                  <PaperTextInput
                    mode="outlined"
                    placeholder="Select applicable items"
                    value={getMenuSummary(ruleFormValues.applicable_items)}
                    editable={false}
                    right={<PaperTextInput.Icon icon="chevron-down" />}
                    outlineStyle={stylesModal.dropdownOutline}
                    style={stylesModal.dropdownInput}
                    theme={{ colors: { outline: "#5E6E4933", primary: "#91B275" } }}
                  />
                </TouchableOpacity>
                <HelperText type="error" visible={!!ruleErrors.applicable_items}>
                  {ruleErrors.applicable_items}
                </HelperText>

                <Text style={stylesModal.fieldLabel}>Excluded items</Text>
                <TouchableOpacity
                  onPress={() => setExcludedSelectorVisible(true)}
                  activeOpacity={0.85}
                >
                  <PaperTextInput
                    mode="outlined"
                    placeholder="Select excluded items"
                    value={getMenuSummary(ruleFormValues.excluded_items)}
                    editable={false}
                    right={<PaperTextInput.Icon icon="chevron-down" />}
                    outlineStyle={stylesModal.dropdownOutline}
                    style={stylesModal.dropdownInput}
                    theme={{ colors: { outline: "#5E6E4933", primary: "#91B275" } }}
                  />
                </TouchableOpacity>
                <HelperText type="error" visible={!!ruleErrors.excluded_items}>
                  {ruleErrors.excluded_items}
                </HelperText>
              </>
            )}

            <View style={stylesModal.toggleRow}>
              <Text style={stylesModal.toggleLabel}>Is percentage</Text>
              <Switch
                value={ruleFormValues.is_percentage}
                onValueChange={(value) =>
                  handleRuleFormChange("is_percentage", value)
                }
                color="#91B275"
              />
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <Button
            mode="contained"
            style={stylesModal.addButton}
            labelStyle={{ color: "#fff" }}
            onPress={handleSubmit}
          >
            Update Discount
          </Button>
        </Dialog.Actions>
      </Dialog>
      <MenuItemSelectorModal
        title="Select applicable items"
        visible={applicableSelectorVisible}
        menus={menus}
        selectedIds={ruleFormValues.applicable_items}
        disabledIds={ruleFormValues.excluded_items}
        onApply={handleApplicableApply}
        onClose={() => setApplicableSelectorVisible(false)}
      />
      <MenuItemSelectorModal
        title="Select excluded items"
        visible={excludedSelectorVisible}
        menus={menus}
        selectedIds={ruleFormValues.excluded_items}
        disabledIds={ruleFormValues.applicable_items}
        onApply={handleExcludedApply}
        onClose={() => setExcludedSelectorVisible(false)}
      />
    </Portal>
  );
}

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: "#EFF4EB",
    width: "45%",
    alignSelf: "center",
    borderRadius: 12,
  },
  content: {
    maxHeight: "70vh",
    paddingBottom: 0,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  menuItem: {
    color: "#333",
    fontSize: 14,
  },
  dropdownBtn: {
    backgroundColor: "#50693A17",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  menuContainer: {
    backgroundColor: "#fff",
  },
  input: {
    backgroundColor: "#50693A17",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#40392B",
    marginBottom: 6,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#91B275",
    borderRadius: 30,
    width: 170,
    alignSelf: "flex-end",
  },
  dateRow: {
    marginBottom: 12,
  },
  dateButton: {
    backgroundColor: "#50693A17",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dateLabel: {
    color: "#22281B",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#D5DEC9",
    marginVertical: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#40392B",
    marginBottom: 12,
  },
  dropdownInput: {
    backgroundColor: "#50693A17",
    marginBottom: 12,
  },
  dropdownOutline: {
    borderRadius: 8,
    borderColor: "#5E6E4933",
  },
});
