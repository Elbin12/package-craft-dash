import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery, BASE_URL } from "../axios/axios";

export const addOnServicesApi = createApi({
  reducerPath: 'addOnServicesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/' }),
  tagTypes: ['AddOn'],
  endpoints: (builder) => ({
    createAddOn: builder.mutation({
      query: (data) => ({
        url: 'addons/',
        method: 'POST',
        data: data,
      }),
      invalidatesTags: ['AddOn'],
    }),
    getAllAddOns: builder.query({
      query: () => ({
        url: 'addons/',
        method: 'GET',
      }),
      providesTags: ['AddOn'],
    }),
    updateAddOn: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `addons/${id}/`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AddOn', id }],
    }),
    partialUpdateAddOn: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `addons/${id}/`,
        method: 'PATCH',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'AddOn', id }],
    }),
    deleteAddOn: builder.mutation({
      query: (id) => ({
        url: `addons/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AddOn'],
    }),
  }),
});

export const {
  useCreateAddOnMutation,
  useGetAllAddOnsQuery,
  useUpdateAddOnMutation,
  usePartialUpdateAddOnMutation,
  useDeleteAddOnMutation,
} = addOnServicesApi;