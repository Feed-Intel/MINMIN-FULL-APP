import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Text,
  Button,
  DataTable,
  Card,
  TextInput,
  Divider,
  ActivityIndicator,
  Snackbar,
  TextInput as PaperTextInput,
} from "react-native-paper";
import { useGetMenus } from "@/services/mutation/menuMutation";
import { MenuType } from "@/types/menuType";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAppSelector } from "@/lib/reduxStore/hooks";
import { useCreateOrder } from "@/services/mutation/orderMutation";
import MenuItemSelectorModal from "@/components/MenuItemSelectorModal";
import ModalHeader from "@/components/ModalHeader";

interface OrderItem {
  id: string;
  menuItem: MenuType | null;
  quantity: number;
  price?: number;
  tax?: number;
  remarks?: string;
}

interface OrderFormData {
  customerName: string;
  contactNumber: string;
  tinNumber?: string;
  items: OrderItem[];
}

const schema: yup.ObjectSchema<OrderFormData> = yup.object({
  customerName: yup.string().required("Customer name is required"),
  contactNumber: yup
    .string()
    .matches(/^\d+$/, "Invalid phone number")
    .required("Contact number is required"),
  tinNumber: yup.string().optional(),
  items: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        menuItem: yup
          .mixed<MenuType>()
          .nullable()
          .required("Item selection is required"),
        quantity: yup.number().min(1, "Minimum quantity is 1").required(),
        price: yup.number(),
        tax: yup.number(),
        specialInstructions: yup.string(),
      })
    )
    .min(1, "At least one item required")
    .required(),
});

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  visible,
  onClose,
  onOrderCreated,
}) => {
  const { width } = useWindowDimensions();
  const { data: menus = [], isLoading: menusLoading } = useGetMenus();
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [selectorRowId, setSelectorRowId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { mutateAsync: createOrder } = useCreateOrder();
  const tenantId = useAppSelector((state) => state.auth.restaurant?.id);
  const branch = useAppSelector((state) => state.auth.restaurant?.branch);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<OrderFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      items: [
        {
          id: Date.now().toString(),
          menuItem: null,
          quantity: 1,
          price: 0,
          tax: 0,
          remarks: "",
        },
      ],
    },
  });

  const orderItems = watch("items");
  const isSmallScreen = width < 768;

  const calculateTotal = () => {
    return orderItems
      .reduce(
        (acc, item) =>
          acc + (item?.price || 0) * item.quantity + (item?.tax || 0) * item.quantity,
        0
      )
      .toFixed(2);
  };

  const handleItemSelect = (itemId: string, menuItem: MenuType) => {
    const updatedItems = orderItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          menuItem,
          price: parseFloat(menuItem.price),
          tax: parseFloat(menuItem.price) * 0.1,
        };
      }
      return item;
    });
    setValue("items", updatedItems);
  };

  const addNewItem = () => {
    const newItem = {
      id: Date.now().toString(),
      menuItem: null,
      quantity: 1,
      price: 0,
      tax: 0,
      remarks: "",
    };
    setValue("items", [...orderItems, newItem]);
  };

  const removeItem = (itemId: string) => {
    if (orderItems.length === 1) return;
    setValue(
      "items",
      orderItems.filter((item) => item.id !== itemId)
    );
    if (selectorRowId === itemId) {
      closeSelector();
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    const updatedItems = orderItems.map((item) =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setValue("items", updatedItems);
  };

  const updateRemarks = (itemId: string, remarks: string) => {
    const updatedItems = orderItems.map((item) =>
      item.id === itemId ? { ...item, remarks } : item
    );
    setValue("items", updatedItems);
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      const orderData = {
        tenant: tenantId,
        branch: branch,
        items: data.items.map((item: OrderItem) => ({
          menu_item: item.menuItem?.id,
          quantity: item.quantity,
          price: item.price,
          remarks: item.remarks,
        })),
      };
      await createOrder(orderData);
      setSnackbarMessage("Order created successfully!");
      setSnackbarVisible(true);
      reset();
      onOrderCreated();
      onClose();
    } catch (error) {
      setSnackbarMessage("Failed to create order.");
      setSnackbarVisible(true);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
    setSelectorVisible(false);
    setSelectorRowId(null);
  };

  const closeSelector = () => {
    setSelectorVisible(false);
    setSelectorRowId(null);
  };

  if (menusLoading) return <ActivityIndicator animating={true} size="large" />;

  return (
    <Modal
      visible={visible}
      onDismiss={handleClose}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
      <Card style={styles.modalCard}>
        <Card.Title title={<ModalHeader title="Create New Order" onClose={handleClose} />} />
        <Card.Content>
          <ScrollView style={styles.scrollView}>
            {/* Customer Information */}
            <View style={[styles.grid, isSmallScreen && styles.column]}>
              <Controller
                control={control}
                name="customerName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Customer Name"
                    value={value}
                    onChangeText={onChange}
                    error={!!errors.customerName}
                    style={styles.input}
                    mode="outlined"
                    outlineStyle={{
                      borderColor: '#91B275',
                      borderWidth: 0,
                      borderRadius: 16,
                    }}
                  />
                )}
              />
              <Controller
                control={control}
                name="contactNumber"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Contact Number"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    error={!!errors.contactNumber}
                    style={styles.input}
                    mode="outlined"
                    outlineStyle={{
                      borderColor: '#91B275',
                      borderWidth: 0,
                      borderRadius: 16,
                    }}
                  />
                )}
              />
            </View>

            <View style={[styles.grid, isSmallScreen && styles.column]}>
              <Controller
                control={control}
                name="tinNumber"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Tin Number (Optional)"
                    value={value}
                    onChangeText={onChange}
                    style={styles.input}
                    mode="outlined"
                    textColor="var(--color-typography-700)"
                    outlineStyle={{
                      borderColor: '#91B275',
                      borderWidth: 0,
                      borderRadius: 16,
                    }}
                  />
                )}
              />
              <View style={styles.inputContainer}>
                
              <Button mode="contained-tonal" style={{
                backgroundColor: '#91B275',
                alignItems: 'center',
                justifyContent: 'center',
                height: 36,
              }} textColor="#fff" onPress={addNewItem}>
                + Add Item
              </Button>
              </View>
            </View>

            {/* Order Items */}
            {/* <View style={styles.itemsHeader}>
              <Text variant="titleMedium">Order Items</Text>
              
            </View> */}

            <ScrollView horizontal>
              <DataTable style={styles.dataTable}>
                <DataTable.Header style={styles.dataTableHeader}>
                  <DataTable.Title style={styles.headerTitle}> <Text variant="titleMedium" style={styles.headerTitleText}>Name</Text></DataTable.Title>
                  <DataTable.Title numeric style={styles.headerTitle}> <Text variant="titleMedium" style={styles.headerTitleText}>Price</Text></DataTable.Title>
                  <DataTable.Title numeric style={styles.headerTitle}> <Text variant="titleMedium" style={styles.headerTitleText}>Qty</Text></DataTable.Title>
                  <DataTable.Title numeric style={styles.headerTitle}> <Text variant="titleMedium" style={styles.headerTitleText}>Remark</Text></DataTable.Title>
                  <DataTable.Title numeric style={styles.headerTitle}> <Text variant="titleMedium" style={styles.headerTitleText}>TAX</Text></DataTable.Title>
                  <DataTable.Title numeric style={styles.headerTitle}> <Text variant="titleMedium" style={styles.headerTitleText}>Total</Text></DataTable.Title>
                  <DataTable.Title style={styles.headerTitle}>Action</DataTable.Title>
                </DataTable.Header>

                {orderItems.map((item) => (
                  <DataTable.Row key={item.id} style={styles.dataTableRow}>
                    <DataTable.Cell>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          setSelectorRowId(item.id);
                          setSelectorVisible(true);
                        }}
                      >
                        <PaperTextInput
                          mode="outlined"
                          placeholder="Select item"
                          value={item.menuItem?.name || ""}
                          editable={false}
                          right={<PaperTextInput.Icon icon="chevron-down" />}
                          outlineStyle={styles.menuInputOutline}
                          style={styles.menuInput}
                          theme={{
                            colors: {
                              outline: "#5E6E4933",
                              primary: "#91B275",
                            },
                          }}
                        />
                      </TouchableOpacity>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.dataTableCell}>
                      <Text style={styles.priceText}>${item.price?.toFixed(2) || "0.00"}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.dataTableCell}>
                      <TextInput
                        value={item.quantity.toString()}
                        onChangeText={(text) =>
                          updateQuantity(item.id, Math.max(1, parseInt(text) || 1))
                        }
                        keyboardType="numeric"
                        style={styles.quantityInput}
                        outlineStyle={styles.quantityOutline}
                        contentStyle={styles.quantityContent}
                        underlineColor="transparent"
                        activeUnderlineColor="#6200ee"
                        mode="outlined"
                      />
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.dataTableCell}>
                      <TextInput
                        value={item.remarks}
                        onChangeText={(text) => updateRemarks(item.id, text)}
                        style={styles.quantityInput}
                        outlineStyle={styles.quantityOutline}
                        contentStyle={styles.quantityContent}
                        underlineColor="transparent"
                        activeUnderlineColor="#6200ee"
                        mode="outlined"
                      />
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.dataTableCell}>
                      <Text style={styles.taxText}>${item.tax?.toFixed(2) || "0.00"}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={styles.dataTableCell}>
                      <Text style={styles.totalText}>
                        ${(((item.price || 0) + (item.tax || 0)) * item.quantity).toFixed(2)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={styles.dataTableCell}>
                      <Button
                        icon="trash-can-outline"
                        onPress={() => removeItem(item.id)}
                        disabled={orderItems.length === 1}
                        mode="text"
                        textColor="#fff"
                        style={styles.deleteButton}
                        contentStyle={styles.deleteButtonContent}
                        labelStyle={styles.deleteButtonLabel}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
      </DataTable>
            </ScrollView>

            {/* Order Summary */}
            <View style={styles.summaryContainer}>
              <Text variant="titleMedium" style={styles.headerTitleText2}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={{fontSize: 11, fontWeight: '300', color: '#5F7A3D'}}>Subtotal:</Text>
                <Text style={{fontSize: 11, fontWeight: '300', color: '#5F7A3D'}}>
                  $
                  {orderItems
                    .reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0)
                    .toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{fontSize: 11, fontWeight: '300', color: '#5F7A3D'}}>Tax:</Text>
                <Text style={{fontSize: 11, fontWeight: '300', color: '#5F7A3D'}}>
                  $
                  {orderItems
                    .reduce((acc, item) => acc + (item.tax || 0) * item.quantity, 0)
                    .toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={{fontSize: 11, fontWeight: '600' , color: '#5F7A3D'}}>Total:</Text>
                <Text style={{fontSize: 11, fontWeight: '600' , color: '#5F7A3D'}}>${calculateTotal()}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                style={{
                  backgroundColor: '#91B275',
                }}
                textColor="#fff"
                labelStyle={{
                  fontWeight: '400',
                  fontSize: 15,
                }}
              >
                Create Order
              </Button>
              <Button
                mode="outlined"
                onPress={handleClose}
                style={{
                  backgroundColor: '#91B27517',
                }}
                textColor="#000000"
                labelStyle={{
                  fontWeight: '400',
                  fontSize: 15,
                }}
              >
                Cancel Order
              </Button>
            </View>
          </ScrollView>
        </Card.Content>
      </Card>
      </View> 
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        <Text>{snackbarMessage}</Text>
      </Snackbar>
      <MenuItemSelectorModal
        title="Select menu item"
        visible={selectorVisible}
        menus={menus}
        selectedIds={
          selectorRowId
            ? (
                orderItems.find((row) => row.id === selectorRowId)?.menuItem
                  ?.id
              ? [
                  orderItems.find((row) => row.id === selectorRowId)?.menuItem
                    ?.id as string,
                ]
              : []
            )
            : []
        }
        onApply={(ids) => {
          const selectedId = ids[0];
          if (selectorRowId && selectedId) {
            const menu = menus.find((m) => m.id === selectedId);
            if (menu) {
              handleItemSelect(selectorRowId, menu);
            }
          }
        }}
        onClose={closeSelector}
        multiSelect={false}
      />
    </Modal>
  );
};

export default OrderModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    padding: 20,
  },
  modalCard: {
    width: '90%',
    maxWidth: 900,
    maxHeight: '95%',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    elevation: 3,
    borderRadius: 12,
    backgroundColor: '#EBF1E6',
  },
  scrollView: {
    maxHeight: '85%',
    overflowY: 'scroll',
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flexDirection: "column",
  },
  input: {
    flex: 1,
    height: 36,
    backgroundColor: '#91B27517',
    borderWidth: 0,
    borderColor: '#91B275',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 8,
    width: '49%',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  dataTable: {
    borderRadius: 12,
    elevation: 3,
    marginVertical: 8,
    minWidth: 800,
  },
  dataTableHeader: {
    borderTopStartRadius: 12,
    borderTopEndRadius: 12,
  },
  headerTitle: {
    justifyContent: "center",
    marginVertical: 12,
  },
  headerTitleText: {
    color: '#4A4A4A',
    fontWeight: '500',
    fontSize: 13,
  },
  headerTitleText2: {
    color: '#22281B',
    fontWeight: '700',
    fontSize: 13,
  },
  dataTableRow: {
    borderBottomWidth: 1,
    height: 72,
  },
  dataTableCell: {
    justifyContent: "center",
    paddingVertical: 12,
  },
  menuInput: {
    backgroundColor: '#50693A17',
    borderRadius: 12,
    width: 220,
  },
  menuInputOutline: {
    borderRadius: 12,
    borderColor: '#5E6E4933',
  },
  quantityInput: {
    width: 64,
    height: 40,
    borderRadius: 6,
    textAlign: "center",
    paddingHorizontal: 4,
    borderColor: '#91B275',
  },
  quantityContent: {
    fontWeight: "400",
    color: '#40392B',
    textAlign: "center",
  },
  quantityOutline: {
    borderColor: '#91B275',
    borderWidth: 1,
    backgroundColor: '#91B27517',
    borderRadius: 16,
  },
  priceText: {
    fontWeight: "400",
    color: '#40392B',
  },
  taxText: {
    fontWeight: "400",
    color: '#40392B',
  },
  totalText: {
    fontWeight: "700",
    color: "#00b894",
  },
  deleteButton: {
    
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  deleteButtonContent: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: '#91B275',
    borderRadius: 50,
    width: 25,
    height: 25,
  },
  deleteButtonLabel: {
    color: '#fff',
    fontWeight: "500",
    marginHorizontal: 10,
  },
  summaryContainer: {
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    backgroundColor: '#EBF1E6',
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    minWidth: 120,
  },
});
