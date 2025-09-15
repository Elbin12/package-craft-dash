import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';
import { servicesApi } from './servicesApi';

export const packagesApi = createApi({
  reducerPath: 'packagesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/packages/'}),
  tagTypes: ['Package'],
  endpoints: (builder) => ({
    getPackages: builder.query({
      query: () => '',
      providesTags: ['Package'],
    }),
    getPackageById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Package', id }],
    }),
    createPackage: builder.mutation({
      query: (packageData) => ({
        url: '',
        method: 'POST',
        data: packageData,
      }),
      invalidatesTags: ['Package'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: created } = await queryFulfilled;
          console.log(created, 'created')
          // call autoMapPackages with the related serviceId
          dispatch(
            servicesApi.endpoints.autoMapPackages.initiate(created.service)
          );
        } catch {}
      },
    }),
    updatePackage: builder.mutation({
      query: ({ id, ...packageData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: packageData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Package', id }],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updated } = await queryFulfilled;
          dispatch(
            servicesApi.endpoints.autoMapPackages.initiate(updated.service)
          );
        } catch {}
      },
    }),
    deletePackage: builder.mutation({
      query: ({id}) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Package'],
      async onQueryStarted({ id, serviceId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log(serviceId, 'deleted')
          dispatch(
            servicesApi.endpoints.autoMapPackages.initiate(serviceId)
          );
        } catch {}
      },
    }),
  }),
});

export const {
  useGetPackagesQuery,
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
} = packagesApi;