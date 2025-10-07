import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image: string;
};

type CartState = {
  items: Dish[];
  restaurantId: string | null;
  branchId: string | null;
  tableId: string | '';
  discount: number;
  redeemAmount: number;
  coupon: string;
  remarks: Record<string, string>;
  transactionId: string | null;
  paymentAPIKEY?: string;
  paymentPUBLICKEY?: string;
  tax?: number;
  serviceCharge?: number;
  error: string | null;
  contactNumber: string;
  customerName: string;
  tinNumber: string;
};

const initialState: CartState = {
  items: [],
  restaurantId: null,
  discount: 0,
  redeemAmount: 0,
  branchId: null,
  tableId: '',
  coupon: '',
  remarks: {},
  transactionId: null,
  error: null,
  tax: 0,
  serviceCharge: 0,
  paymentAPIKEY: '',
  contactNumber: '',
  customerName: '',
  tinNumber: '',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{
        item: Dish;
        restaurantId: string;
        branchId: string;
        tableId: string;
        paymentAPIKEY?: string;
        paymentPUBLICKEY?: string;
        tax?: number;
        serviceCharge?: number;
      }>
    ) {
      const {
        item,
        restaurantId,
        branchId,
        tableId,
        paymentAPIKEY,
        paymentPUBLICKEY,
        tax,
        serviceCharge,
      } = action.payload;

      // Check if cart already has items from a different restaurant/branch
      if (
        state.restaurantId !== null &&
        (state.restaurantId !== restaurantId || state.branchId !== branchId)
      ) {
        state.error =
          'You cannot add items from different restaurant or branch.';
        return;
      }

      // Clear error if validation passes
      state.error = null;
      const existingItem = state.items.find(
        (cartItem) => cartItem.id === item.id
      );
      if (!existingItem) {
        state.items.push(item);
      }
      state.restaurantId = restaurantId;
      state.branchId = branchId;
      state.tableId = tableId;
      state.paymentAPIKEY = paymentAPIKEY;
      state.paymentPUBLICKEY = paymentPUBLICKEY;
      state.tax = tax;
      state.serviceCharge = serviceCharge;
    },
    setCustomerInfo: (
      state,
      action: PayloadAction<{
        customerName?: string;
        contactNumber?: string;
        tinNumber?: string;
      }>
    ) => {
      state.customerName = action.payload.customerName || state.customerName;
      state.contactNumber = action.payload.contactNumber || state.contactNumber;
      state.tinNumber = action.payload.tinNumber || state.tinNumber;
      return state;
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>
    ) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index >= 0) {
        if (action.payload.quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index].quantity = action.payload.quantity;
        }
      }
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.branchId = null;
        state.tableId = '';
        state.coupon = '';
        state.remarks = {};
        state.transactionId = null;
        state.error = null;
      }
    },
    setRemarks: (state, action: PayloadAction<Record<string, string>>) => {
      const tempstate = { ...state.remarks, ...action.payload };
      state = { ...state, remarks: tempstate };
      return state;
    },
    setRedeemAmount: (state, action: PayloadAction<number>) => {
      state = { ...state, redeemAmount: action.payload };
      return state;
    },
    setTransactionId: (state, action: PayloadAction<string>) => {
      state = { ...state, transactionId: action.payload };
      return state;
    },
    setCoupon: (state, action: PayloadAction<string>) => {
      state = { ...state, coupon: action.payload };
      return state;
    },
    setDiscount: (state, action: PayloadAction<number>) => {
      state = { ...state, discount: action.payload };
      return state;
    },
    reorder: (
      state,
      action: PayloadAction<{
        items: Dish[];
        restaurantId: string;
        branchId: string;
        tableId: string;
      }>
    ) => {
      const { items, restaurantId, branchId, tableId } = action.payload;

      // Clear cart if ordering from different establishment
      if (
        state.restaurantId !== restaurantId ||
        state.branchId !== branchId ||
        state.tableId !== tableId
      ) {
        state.items = [];
        state.restaurantId = restaurantId;
        state.branchId = branchId;
        state.tableId = tableId;
      }

      // Add items with quantity accumulation
      items.forEach((newItem) => {
        const existingItem = state.items.find((item) => item.id === newItem.id);
        if (existingItem) {
          existingItem.quantity += newItem.quantity;
        } else {
          state.items.push({ ...newItem });
        }
      });
    },
    removeFromCart(state, action: PayloadAction<string>) {
      // Change payload type to string
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.branchId = null;
        state.tableId = '';
        state.coupon = '';
        state.remarks = {};
        state.transactionId = null;
        state.error = null;
      }
    },
    clearCartError(state) {
      state.error = null;
    },
    clearCart(state) {
      state.items = [];
      state.restaurantId = null;
      state.branchId = null;
      state.tableId = '';
      state.coupon = '';
      state.remarks = {};
      state.transactionId = null;
      state.discount = 0;
      state.error = null;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  updateQuantity,
  reorder,
  setRemarks,
  setCoupon,
  setTransactionId,
  setDiscount,
  setRedeemAmount,
  clearCartError,
  setCustomerInfo,
} = cartSlice.actions;
export default cartSlice.reducer;
