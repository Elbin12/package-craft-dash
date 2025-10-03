import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const couponsApi = createApi({
  reducerPath: 'couponsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/coupons/' }),
  tagTypes: ['Coupon'],
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: () => '',
      providesTags: ['Coupon'],
    }),
    getCouponById: builder.query({
      query: (id) => ({ url: `${id}/` }),
      providesTags: (result, error, id) => [{ type: 'Coupon', id }],
    }),
    createCoupon: builder.mutation({
      query: (couponData) => ({
        url: '',
        method: 'POST',
        data: couponData,
      }),
      invalidatesTags: ['Coupon'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...couponData }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: couponData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Coupon', id }, 'Coupon'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupon'],
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApi;