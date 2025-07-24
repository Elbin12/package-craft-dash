import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  services: [],
  selectedService: null,
  wizardOpen: false,
  editingService: null,
  deleteConfirmOpen: false,
  serviceToDelete: null,
};

const servicesSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setServices: (state, action) => {
      state.services = action.payload;
    },
    setSelectedService: (state, action) => {
      state.selectedService = action.payload;
    },
    setWizardOpen: (state, action) => {
      state.wizardOpen = action.payload;
    },
    setEditingService: (state, action) => {
      state.editingService = action.payload;
    },
    setDeleteConfirmOpen: (state, action) => {
      state.deleteConfirmOpen = action.payload;
    },
    setServiceToDelete: (state, action) => {
      state.serviceToDelete = action.payload;
    },
    addService: (state, action) => {
      state.services.push(action.payload);
    },
    updateService: (state, action) => {
      const index = state.services.findIndex(service => service.id === action.payload.id);
      if (index !== -1) {
        state.services[index] = action.payload;
      }
    },
    removeService: (state, action) => {
      state.services = state.services.filter(service => service.id !== action.payload);
    },
    clearEditingService: (state) => {
      state.editingService = null;
    },
  },
});

export const {
  setServices,
  setSelectedService,
  setWizardOpen,
  setEditingService,
  setDeleteConfirmOpen,
  setServiceToDelete,
  addService,
  updateService,
  removeService,
  clearEditingService,
} = servicesSlice.actions;

export default servicesSlice.reducer;