import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../../axios/axios';

export const userServicesApi = createApi({
  reducerPath: 'userServicesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/user/services/' }),
  tagTypes: ['UserService'],
  endpoints: (builder) => ({
    getServices: builder.query({
      query: () => '',
      providesTags: (result) =>
        result
          ? result.map((svc) => ({ type: 'UserService', id: svc.id }))
          : ['UserService'],
    }),
    getServiceById: builder.query({
      query: (id) => `${id}/`,
      providesTags: (result, error, id) => [{ type: 'UserService', id }],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
} = userServicesApi;
