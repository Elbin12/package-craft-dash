import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/' }),
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
          url: `dashboard/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Dashboard'],
    }),
    getSubmissions: builder.query({
      query: ({ startDate, endDate, page = 1, pageSize = 10, status, search } = {}) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (page) params.append('page', page);
        if (pageSize) params.append('page_size', pageSize);
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        
        return {
          url: `dashboard/submissions/`,
          method: 'GET',
          params: params
        };
      },
      providesTags: ['Dashboard'],
    }),
    getLeadSourceAnalytics: builder.query({
      query: ({ startDate, endDate } = {}) => {
        const params = new URLSearchParams()
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const queryString = params.toString()
        return {
          url: `lead-source-analytics/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        }
      },
      providesTags: ['LeadSourceAnalytics'],
      transformResponse: (response) => {
        // Transform response if needed
        return response
      },
    }),
    getLeadSourceTrends: builder.query({
      query: ({ startDate, endDate } = {}) => {
        const params = new URLSearchParams()
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)

        const queryString = params.toString()
        return {
          url: `lead-source-trends/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
        }
      },
      providesTags: ['LeadSourceAnalytics'],
    }),

    exportLeadSourceReport: builder.query({
      query: ({ startDate, endDate, format = 'csv' } = {}) => {
        const params = new URLSearchParams()
        if (startDate) params.append('start_date', startDate)
        if (endDate) params.append('end_date', endDate)
        params.append('format', format)

        const queryString = params.toString()
        return {
          url: `lead-source-analytics/export/${queryString ? `?${queryString}` : ''}`,
          method: 'GET',
          responseType: format === 'csv' ? 'blob' : 'json',
        }
      },
    }),
  }),
});

export const {
  useGetDashboardDataQuery,
  useGetSubmissionsQuery,
  useGetLeadSourceTrendsQuery,
  useExportLeadSourceReportQuery,
  useGetLeadSourceAnalyticsQuery
} = dashboardApi;