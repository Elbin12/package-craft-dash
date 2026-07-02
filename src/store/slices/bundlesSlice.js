import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dialogOpen: false,
  editingBundle: null,
  formData: {
    name: '',
    description: '',
    discount_type: 'percent',
    discount_percentage: '',
    discount_fixed: '',
    is_active: true,
    services: [],
  },
};

const bundlesSlice = createSlice({
  name: 'bundles',
  initialState,
  reducers: {
    setDialogOpen: (state, action) => {
      state.dialogOpen = action.payload;
    },
    setEditingBundle: (state, action) => {
      state.editingBundle = action.payload;
    },
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetFormData: (state) => {
      state.formData = initialState.formData;
    },
  },
});

export const { setDialogOpen, setEditingBundle, setFormData, resetFormData } = bundlesSlice.actions;
export default bundlesSlice.reducer;
