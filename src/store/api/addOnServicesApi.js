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
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'AddOn', id })),
              { type: 'AddOn', id: 'LIST' }
            ]
          : [{ type: 'AddOn', id: 'LIST' }],
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
    // Quantity Discount endpoints
    createQuantityDiscount: builder.mutation({
      query: (data) => ({
        url: 'quantity-discounts/',
        method: 'POST',
        data: data,
      }),
      invalidatesTags: ['QuantityDiscount'],
    }),
    getQuantityDiscounts: builder.query({
      query: (questionId) => ({
        url: `quantity-discounts/?question=${questionId}`,
        method: 'GET',
      }),
      providesTags: ['QuantityDiscount'],
    }),
    updateQuantityDiscount: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `quantity-discounts/${id}/`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'QuantityDiscount', id }],
    }),
    deleteQuantityDiscount: builder.mutation({
      query: (id) => ({
        url: `quantity-discounts/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QuantityDiscount'],
    }),
  }),
});

export const {
  useCreateAddOnMutation,
  useGetAllAddOnsQuery,
  useUpdateAddOnMutation,
  usePartialUpdateAddOnMutation,
  useDeleteAddOnMutation,

  useCreateQuantityDiscountMutation,
  useGetQuantityDiscountsQuery,
  useUpdateQuantityDiscountMutation,
  useDeleteQuantityDiscountMutation,
  useLazyGetQuantityDiscountsQuery
} = addOnServicesApi;