import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const bundlesApi = createApi({
  reducerPath: 'bundlesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/bundles/' }),
  tagTypes: ['Bundle'],
  endpoints: (builder) => ({
    getBundles: builder.query({
      query: () => '',
      providesTags: ['Bundle'],
    }),
    getBundleById: builder.query({
      query: (id) => ({ url: `${id}/` }),
      providesTags: (result, error, id) => [{ type: 'Bundle', id }],
    }),
    createBundle: builder.mutation({
      query: (bundleData) => ({
        url: '',
        method: 'POST',
        data: bundleData,
      }),
      invalidatesTags: ['Bundle'],
    }),
    updateBundle: builder.mutation({
      query: ({ id, ...bundleData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: bundleData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Bundle', id }, 'Bundle'],
    }),
    deleteBundle: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bundle'],
    }),
  }),
});

export const {
  useGetBundlesQuery,
  useGetBundleByIdQuery,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  useDeleteBundleMutation,
} = bundlesApi;
