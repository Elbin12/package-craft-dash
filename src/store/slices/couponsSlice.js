import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dialogOpen: false,
  editingCoupon: null,
  formData: {
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    expiration_date: '',
    is_active: true,
    is_global: false,
  },
};

const couponsSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    setDialogOpen: (state, action) => {
      state.dialogOpen = action.payload;
    },
    setEditingCoupon: (state, action) => {
      state.editingCoupon = action.payload;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetFormData: (state) => {
      state.formData = initialState.formData;
    },
  },
});

export const { setDialogOpen, setEditingCoupon, setFormData, resetFormData } = couponsSlice.actions;
export default couponsSlice.reducer;