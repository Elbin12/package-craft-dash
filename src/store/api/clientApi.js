import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const clientApi = createApi({
  reducerPath: 'clientApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/' }),
  tagTypes: ['Clients', 'ClientDetail', 'ClientSubmissions'],
  endpoints: (builder) => ({
    getClients: builder.query({
      query: ({ page = 1, pageSize = 10, search = '', includeOnTheGo = false } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('page_size', pageSize);
        if (search) params.append('search', search);
        params.append('include_on_the_go', includeOnTheGo);
        return {
          url: 'clients/',
          method: 'GET',
          params,
        };
      },
      providesTags: ['Clients'],
    }),
    getClientDetail: builder.query({
      query: (clientId) => ({
        url: `clients/${clientId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, clientId) => [{ type: 'ClientDetail', id: clientId }],
    }),
    getClientSubmissions: builder.query({
      query: ({ clientId, page = 1, pageSize = 10, status = '' } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('page_size', pageSize);
        if (status) params.append('status', status);
        return {
          url: `clients/${clientId}/submissions/`,
          method: 'GET',
          params,
        };
      },
      providesTags: (result, error, { clientId }) => [
        { type: 'ClientSubmissions', id: clientId },
      ],
    }),
    getClientSubmissionDetail: builder.query({
      query: ({ clientId, submissionId }) => ({
        url: `clients/${clientId}/submissions/${submissionId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, { submissionId }) => [
        { type: 'ClientSubmissions', id: submissionId },
        'ClientSubmissions',
      ],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientDetailQuery,
  useGetClientSubmissionsQuery,
  useGetClientSubmissionDetailQuery,
} = clientApi;
