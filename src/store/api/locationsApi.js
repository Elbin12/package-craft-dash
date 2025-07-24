import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'http://localhost:3000/api'; // Replace with your backend URL

export const locationsApi = createApi({
  reducerPath: 'locationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/locations`,
    prepareHeaders: (headers) => {
      // Add auth token if needed
      return headers;
    },
  }),
  tagTypes: ['Location'],
  endpoints: (builder) => ({
    getLocations: builder.query({
      query: () => '',
      providesTags: ['Location'],
    }),
    getLocationById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Location', id }],
    }),
    createLocation: builder.mutation({
      query: (locationData) => ({
        url: '',
        method: 'POST',
        body: locationData,
      }),
      invalidatesTags: ['Location'],
    }),
    updateLocation: builder.mutation({
      query: ({ id, ...locationData }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: locationData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Location', id }],
    }),
    deleteLocation: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Location'],
    }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationByIdQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationsApi;