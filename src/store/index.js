import { configureStore } from '@reduxjs/toolkit';
import { servicesApi } from './api/servicesApi';
import { locationsApi } from './api/locationsApi';
import { bookingApi } from './api/bookingApi';
import { packagesApi } from './api/packagesApi';
import { featuresApi } from './api/featuresApi';
import { questionsApi } from './api/questionsApi';
import servicesSlice from './slices/servicesSlice';
import locationsSlice from './slices/locationsSlice';
import bookingSlice from './slices/bookingSlice';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    services: servicesSlice,
    locations: locationsSlice,
    booking: bookingSlice,
    auth: authSlice,
    [servicesApi.reducerPath]: servicesApi.reducer,
    [locationsApi.reducerPath]: locationsApi.reducer,
    [bookingApi.reducerPath]: bookingApi.reducer,
    [packagesApi.reducerPath]: packagesApi.reducer,
    [featuresApi.reducerPath]: featuresApi.reducer,
    [questionsApi.reducerPath]: questionsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
        ],
      },
    })
      .concat(servicesApi.middleware)
      .concat(locationsApi.middleware)
      .concat(bookingApi.middleware)
      .concat(packagesApi.middleware)
      .concat(featuresApi.middleware)
      .concat(questionsApi.middleware),
});

export default store;