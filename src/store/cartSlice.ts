import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Article } from '../types';

interface CartItem extends Article {
  cartId: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Article>) => {
      const cartId = Date.now().toString();
      state.items.push({ ...action.payload, cartId });
      
      state.total = state.items.reduce(
        (sum, item) => sum + item.price!,
        0
      );
    },
    
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.cartId !== action.payload);
      state.total = state.items.reduce(
        (sum, item) => sum + item.price!,
        0
      );
    },
    
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addItem, removeItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer; 