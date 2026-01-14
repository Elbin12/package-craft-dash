import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const adminsApi = createApi({
  reducerPath: 'adminsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/admins/' }),
  tagTypes: ['Admin'],
  endpoints: (builder) => ({
    getAdmins: builder.query({
      query: () => '',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Admin', id })),
              { type: 'Admin', id: 'LIST' },
            ]
          : [{ type: 'Admin', id: 'LIST' }],
    }),
    getAdminById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'Admin', id }],
    }),
    createAdmin: builder.mutation({
      query: (adminData) => ({
        url: '',
        method: 'POST',
        data: adminData,
      }),
      invalidatesTags: [{ type: 'Admin', id: 'LIST' }],
    }),
    updateAdmin: builder.mutation({
      query: ({ id, ...adminData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: adminData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Admin', id },
        { type: 'Admin', id: 'LIST' },
      ],
    }),
    deleteAdmin: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Admin', id },
        { type: 'Admin', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useGetAdminByIdQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
} = adminsApi;

