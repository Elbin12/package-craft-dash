import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/dashboard/' }),
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardData: builder.query({
      query: ({ startDate, endDate, page = 1, pageSize = 10 } = {}) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (page) params.append('page', page);
        if (pageSize) params.append('page_size', pageSize);
        
        const queryString = params.toString();
        return {
          url: `${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Dashboard'],
    }),
    getSubmissions: builder.query({
      query: ({ startDate, endDate, page = 1, pageSize = 10 } = {}) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (page) params.append('page', page);
        if (pageSize) params.append('page_size', pageSize);
        
        return {
          url: `submissions/`,
          method: 'GET',
          params: params
        };
      },
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardDataQuery,
  useGetSubmissionsQuery
} = dashboardApi;