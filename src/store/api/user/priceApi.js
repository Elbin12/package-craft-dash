import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../../axios/axios';

export const priceApi = createApi({
  reducerPath: 'priceApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/user/' }),
  endpoints: (builder) => ({
    calculatePrice: builder.mutation({
      query: (payload) => ({
        url: 'calculate-price/',
        method: 'POST',
        data: payload,
      }),
    }),
    getServices: builder.query({
        query: ()=>({url:`services/`}),
        providesTags: ['services'],
    }),
  }),
});

export const { useCalculatePriceMutation, useGetServicesQuery } = priceApi;