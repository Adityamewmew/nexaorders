import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrderStatus } from '@/types';

interface OrderState {
  items: Order[];
}

// Initial state kosong — data diambil dari API
const initialState: OrderState = {
  items: []
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (state, action: PayloadAction<Order>) => {
      state.items.unshift(action.payload);
    },
    setItems: (state, action: PayloadAction<Order[]>) => {
      state.items = action.payload;
    },
    updateOrderStatus: (state, action: PayloadAction<{ id: string; status: OrderStatus }>) => {
      const order = state.items.find(o => o.id === action.payload.id);
      if (order) {
        order.status = action.payload.status;
      }
    },
    updatePaymentStatus: (state, action: PayloadAction<{ id: string; paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' }>) => {
      const order = state.items.find(o => o.id === action.payload.id);
      if (order) {
        order.paymentMethod = action.payload.paymentMethod;
      }
    }
  }
});

export const { addOrder, setItems, updateOrderStatus, updatePaymentStatus } = orderSlice.actions;
export default orderSlice.reducer;
