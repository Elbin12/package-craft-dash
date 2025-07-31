import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentStep: 0,
  userInfo: {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    latitude: '', // if you capture these later
    longitude: '',
    googlePlaceId: '',
    contactId: null, // <- will store created contact's id
  },
  selectedService: null,
  selectedPackage: null,
  answers: {},
  totalPrice: 0,
  bookingData: null,
  services: [],
  packages: [],
  questions: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    setUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
    },
    setSelectedService: (state, action) => {
      state.selectedService = action.payload;
      // Reset dependent selections when service changes
      state.selectedPackage = null;
      state.answers = {};
      state.totalPrice = 0;
    },
    setSelectedPackage: (state, action) => {
      state.selectedPackage = action.payload;
      // Reset answers when package changes
      state.answers = {};
      state.totalPrice = 0;
    },
    setAnswers: (state, action) => {
      state.answers = { ...state.answers, ...action.payload };
    },
    setTotalPrice: (state, action) => {
      state.totalPrice = action.payload;
    },
    setBookingData: (state, action) => {
      state.bookingData = action.payload;
    },
    setServices: (state, action) => {
      state.services = action.payload;
    },
    setPackages: (state, action) => {
      state.packages = action.payload;
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    resetBooking: (state) => {
      return { ...initialState, services: state.services };
    },
    nextStep: (state) => {
      state.currentStep += 1;
    },
    prevStep: (state) => {
      state.currentStep -= 1;
    },
  },
});

export const {
  setCurrentStep,
  setUserInfo,
  setSelectedService,
  setSelectedPackage,
  setAnswers,
  setTotalPrice,
  setBookingData,
  setServices,
  setPackages,
  setQuestions,
  resetBooking,
  nextStep,
  prevStep,
} = bookingSlice.actions;

export default bookingSlice.reducer;