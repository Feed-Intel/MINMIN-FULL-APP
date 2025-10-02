import { DiscountRule } from "@/types/discountTypes";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Switch,
  Text,
  Button,
  Snackbar,
  HelperText,
  Portal,
  Dialog,
} from "react-native-paper";
import { useQueryClient } from "@tanstack/react-query";
import { useUpdateDiscountRule } from "@/services/mutation/discountMutation";
import { MultiSelectDropdown } from "react-native-paper-dropdown";
import { useGetMenus } from "@/services/mutation/menuMutation";
import Toast from "react-native-toast-message";

const stylesModal = StyleSheet.create({
  dialog: {
    backgroundColor: "#EFF4EB",
    width: "40%",
    alignSelf: "center",
    borderRadius: 12,
  },
  menuItem: {
    color: "#333",
    fontSize: 14,
  },
  container: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: "#50693A17",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 15,
    color: "#333",
  },
  dropdownBtn: {
    backgroundColor: "#50693A17",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 15,
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 5,
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
    width: 145,
    alignSelf: "flex-end",
  },
});

const EditDiscountRuleModal = ({
  discountRule,
  visible,
  setVisible,
}: {
  discountRule: any;
  visible: boolean;
  setVisible: Function;
}) => {
  const [ruleFormValues, setRuleFormValues] = useState<Partial<DiscountRule>>({
    id: discountRule.id,
    discount_id: discountRule.discount_id.id,
    min_items: discountRule.min_items,
    max_items: discountRule.max_items,
    min_price: discountRule.min_price,
    applicable_items: Array.isArray(discountRule.applicable_items)
      ? discountRule.applicable_items
      : discountRule.applicable_items
      ? [discountRule.applicable_items]
      : [],
    excluded_items: Array.isArray(discountRule.excluded_items)
      ? discountRule.excluded_items
      : discountRule.excluded_items
      ? [discountRule.excluded_items]
      : [],
    combo_size: discountRule.combo_size,
    buy_quantity: discountRule.buy_quantity,
    get_quantity: discountRule.get_quantity,
    is_percentage: discountRule.is_percentage,
    max_discount_amount: discountRule.max_discount_amount,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const queryClient = useQueryClient();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const { data: menus } = useGetMenus();
  const { mutateAsync: updateDiscountRule, isPending } =
    useUpdateDiscountRule();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 600;

  const handleRuleFormChange = (
    key: string,
    value: string | boolean | any[]
  ) => {
    const normalizedValue =
      key === "applicable_items" || key === "excluded_items"
        ? Array.isArray(value)
          ? value
          : value == null || value === ""
          ? []
          : [value]
        : value;

    setRuleFormValues((prev) => ({
      ...prev,
      [key]: normalizedValue,
    }));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // Validate Discount Selection
    if (!ruleFormValues.discount_id) {
      errors.discount_id = "Discount selection is required.";
    }

    // Validate Min Items
    if (
      (!ruleFormValues.min_items || isNaN(Number(ruleFormValues.min_items))) &&
      discountRule.discount_id.type == "volume"
    ) {
      errors.min_items = "Min Items must be a valid number.";
    } else if (Number(ruleFormValues.min_items) <= 0) {
      errors.min_items = "Min Items must be greater than 0.";
    }

    if (
      (!ruleFormValues.buy_quantity ||
        isNaN(Number(ruleFormValues.buy_quantity))) &&
      (discountRule.discount_id.type == "freeItem" ||
        discountRule.discount_id.type == "bogo")
    ) {
      errors.buy_quantity = "Buy Quantity must be a valid number.";
    } else if (
      Number(ruleFormValues.buy_quantity) <= 0 &&
      (discountRule.discount_id.type == "freeItem" ||
        discountRule.discount_id.type == "bogo")
    ) {
      errors.buy_quantity = "Buy Quantity must be greater than 0.";
    }

    if (
      (!ruleFormValues.get_quantity ||
        isNaN(Number(ruleFormValues.get_quantity))) &&
      (discountRule.discount_id.type == "freeItem" ||
        discountRule.discount_id.type == "bogo")
    ) {
      errors.get_quantity = "Get Quantity must be a valid number.";
    } else if (
      Number(ruleFormValues.get_quantity) <= 0 &&
      (discountRule.discount_id.type == "freeItem" ||
        discountRule.discount_id.type == "bogo")
    ) {
      errors.get_quantity = "Get Quantity must be greater than 0.";
    }

    // Validate Min Price
    if (
      (!ruleFormValues.max_discount_amount ||
        isNaN(Number(ruleFormValues.max_discount_amount))) &&
      discountRule.discount_id.type != "bogo" &&
      discountRule.discount_id.type != "freeItem"
    ) {
      errors.min_price = "Max Discount Amount must be a valid number.";
    } else if (Number(ruleFormValues.max_discount_amount) < 0) {
      errors.min_price = "Min Discount Amount must be non-negative.";
    }

    // Validate Applicable Items
    if (
      (!ruleFormValues.applicable_items ||
        ruleFormValues.applicable_items.length === 0) &&
      (discountRule.discount_id.type == "bogo" ||
        discountRule.discount_id.type == "freeItem")
    ) {
      errors.applicable_items = "At least one applicable item is required.";
    }

    // Validate Excluded Items (Optional)
    if (
      ruleFormValues.excluded_items &&
      ruleFormValues.excluded_items.some((item) =>
        ruleFormValues.applicable_items?.includes(item)
      )
    ) {
      errors.excluded_items =
        "Excluded items cannot overlap with applicable items.";
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRule = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...ruleFormValues,
        min_items:
          ruleFormValues.min_items !== undefined &&
          ruleFormValues.min_items !== null &&
          ruleFormValues.min_items !== ""
            ? Number(ruleFormValues.min_items)
            : ruleFormValues.min_items,
        max_items:
          ruleFormValues.max_items !== undefined &&
          ruleFormValues.max_items !== null &&
          ruleFormValues.max_items !== ""
            ? Number(ruleFormValues.max_items)
            : ruleFormValues.max_items,
        min_price:
          ruleFormValues.min_price !== undefined &&
          ruleFormValues.min_price !== null &&
          ruleFormValues.min_price !== ""
            ? Number(ruleFormValues.min_price)
            : ruleFormValues.min_price,
        combo_size:
          ruleFormValues.combo_size !== undefined &&
          ruleFormValues.combo_size !== null &&
          ruleFormValues.combo_size !== ""
            ? Number(ruleFormValues.combo_size)
            : ruleFormValues.combo_size,
        buy_quantity:
          ruleFormValues.buy_quantity !== undefined &&
          ruleFormValues.buy_quantity !== null &&
          ruleFormValues.buy_quantity !== ""
            ? Number(ruleFormValues.buy_quantity)
            : ruleFormValues.buy_quantity,
        get_quantity:
          ruleFormValues.get_quantity !== undefined &&
          ruleFormValues.get_quantity !== null &&
          ruleFormValues.get_quantity !== ""
            ? Number(ruleFormValues.get_quantity)
            : ruleFormValues.get_quantity,
        max_discount_amount:
          ruleFormValues.max_discount_amount !== undefined &&
          ruleFormValues.max_discount_amount !== null &&
          ruleFormValues.max_discount_amount !== ""
            ? Number(ruleFormValues.max_discount_amount)
            : ruleFormValues.max_discount_amount,
      };

      await updateDiscountRule(payload);
      queryClient.invalidateQueries({ queryKey: ["discountRules"] });
      setVisible(null);
      setSnackbarVisible(true);
    } catch (error) {
      console.error("Error creating discount rule:", error);
      Toast.show({
        type: "error",
        text1: "Failed to create discount rule",
        text2: "Please try again.",
      });
    }
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => setVisible(null)}
        style={stylesModal.dialog}
      >
        <Dialog.Content>
          <ScrollView contentContainerStyle={stylesModal.container}>
            <View>
              {/* Min Items */}
              {discountRule.discount_id.type == "volume" && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    keyboardType="numeric"
                    placeholder="Enter Minimum Items"
                    value={ruleFormValues.min_items?.toString() || ""}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9]/g, "");
                      handleRuleFormChange("min_items", sanitizedValue);
                    }}
                  />

                  <HelperText type="error" visible={!!errors.min_items}>
                    {errors.min_items}
                  </HelperText>
                </>
              )}
              {discountRule.discount_id.type != "bogo" &&
                discountRule.discount_id.type != "freeItem" && (
                  <>
                    <TextInput
                      style={stylesModal.input}
                      placeholder="Enter Max Discount Amount"
                      value={
                        ruleFormValues.max_discount_amount?.toString() || ""
                      }
                      onChangeText={(value) => {
                        const sanitizedValue = value.replace(/[^0-9.,\-]/g, "");
                        handleRuleFormChange(
                          "max_discount_amount",
                          sanitizedValue
                        );
                      }}
                    />
                    <HelperText
                      type="error"
                      visible={!!errors.max_discount_amount}
                    >
                      {errors.max_discount_amount}
                    </HelperText>
                  </>
                )}
              {discountRule.discount_id.type == "combo" && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Combo Size"
                    value={ruleFormValues.combo_size?.toString() || ""}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9\\.,-]/g, "");
                      handleRuleFormChange("combo_size", sanitizedValue);
                    }}
                  />
                  <HelperText type="error" visible={!!errors.combo_size}>
                    {errors.combo_size}
                  </HelperText>
                </>
              )}
              {(discountRule.discount_id.type == "bogo" ||
                discountRule.discount_id.type == "freeItem") && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Buy Quantity"
                    value={ruleFormValues.buy_quantity?.toString() || ""}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9\\.,-]/g, "");
                      handleRuleFormChange("buy_quantity", sanitizedValue);
                    }}
                  />
                  <HelperText type="error" visible={!!errors.buy_quantity}>
                    {errors.buy_quantity}
                  </HelperText>
                </>
              )}
              {(discountRule.discount_id.type == "bogo" ||
                discountRule.discount_id.type == "freeItem") && (
                <>
                  <TextInput
                    style={stylesModal.input}
                    placeholder="Enter Get Quantity"
                    value={ruleFormValues.get_quantity?.toString() || ""}
                    onChangeText={(value) => {
                      const sanitizedValue = value.replace(/[^0-9\\.,-]/g, "");
                      handleRuleFormChange("get_quantity", sanitizedValue);
                    }}
                  />
                  <HelperText type="error" visible={!!errors.get_quantity}>
                    {errors.get_quantity}
                  </HelperText>
                </>
              )}

              {(discountRule.discount_id.type == "bogo" ||
                discountRule.discount_id.type == "freeItem") && (
                <>
                  <MultiSelectDropdown
                    label="Applicable Items"
                    placeholder="Select Applicable Items"
                    options={
                      menus
                        ?.filter(
                          (mn) =>
                            mn.id &&
                            !ruleFormValues?.excluded_items?.includes(mn.id)
                        )
                        .map((mn) => ({ label: mn.name, value: mn.id! })) || []
                    }
                    value={ruleFormValues.applicable_items || []}
                    onSelect={(values) =>
                      handleRuleFormChange("applicable_items", values)
                    }
                    error={!!errors.applicable_items}
                  />
                  <HelperText type="error" visible={!!errors.applicable_items}>
                    {errors.applicable_items}
                  </HelperText>
                </>
              )}

              {/* Excluded Items */}
              {discountRule.discount_id.type == "freeItem" && (
                <>
                  <MultiSelectDropdown
                    label="Excluded Items"
                    placeholder="Select Excluded Items"
                    options={
                      menus
                        ?.filter(
                          (mn) =>
                            mn.id &&
                            !ruleFormValues?.applicable_items?.includes(mn.id)
                        )
                        .map((mn) => ({ label: mn.name, value: mn.id! })) || []
                    }
                    value={ruleFormValues.excluded_items || []}
                    onSelect={(values) =>
                      handleRuleFormChange("excluded_items", values)
                    }
                    error={!!errors.excluded_items}
                  />
                  <HelperText type="error" visible={!!errors.excluded_items}>
                    {errors.excluded_items}
                  </HelperText>
                </>
              )}
              {/* Is Percentage */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 15,
                }}
              >
                <Text style={{ color: "#40392B" }}>Is Percentage</Text>
                <Switch
                  value={ruleFormValues.is_percentage}
                  onValueChange={(value) =>
                    handleRuleFormChange("is_percentage", value)
                  }
                  color="#91B275"
                />
              </View>
              {/* Save Button */}
              <Button
                mode="contained"
                onPress={handleSaveRule}
                style={stylesModal.addButton}
                loading={isPending}
                disabled={isPending}
                labelStyle={{ color: "#fff" }}
              >
                Update Rule
              </Button>
              <Snackbar
                visible={snackbarVisible}
                onDismiss={() => setSnackbarVisible(false)}
                duration={3000}
              >
                Discount Rule Updated Successfully
              </Snackbar>
            </View>
          </ScrollView>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

export default EditDiscountRuleModal;
