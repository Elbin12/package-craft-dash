import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const servicesApi = createApi({
  reducerPath: 'servicesApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/services/'}),
  tagTypes: ['Service'],
  endpoints: (builder) => ({
    getServices: builder.query({
      query: () => '',
      providesTags: ['Service'],
    }),
    getServiceById: builder.query({
      query: (id) => ({ url: `${id}/` }),
      providesTags: (result, error, id) => [{ type: 'Service', id }],
    }),
    createService: builder.mutation({
      query: (body) => ({
        url: '',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Service'],
    }),
    updateService: builder.mutation({
      query: (requestPayload) => {
        const { id, formData, ...jsonBody } = requestPayload;
        if (formData) {
          return { url: `${id}/`, method: 'PATCH', data: formData };
        }
        return { url: `${id}/`, method: 'PATCH', data: jsonBody };
      },
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedService } = await queryFulfilled;

          // Update getServices cache
          dispatch(
            servicesApi.util.updateQueryData("getServices", undefined, draft => {
              const index = draft.findIndex(s => s.id === id);
              if (index !== -1) {
                draft[index] = {
                  ...draft[index],
                  ...updatedService,
                };
              }
            })
          );
        } catch (err) {
          console.error("Failed to update cache:", err);
        }
      },
    }),
    EditService: builder.mutation({
      query: (requestPayload) => {
        const { id, formData, ...jsonBody } = requestPayload;
        if (formData) {
          return { url: `${id}/`, method: 'PATCH', data: formData };
        }
        return { url: `${id}/`, method: 'PATCH', data: jsonBody };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Service', id }],
    }),
    deleteService: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Service'],
    }),
    createServiceSettings: builder.mutation({
      query: ({ serviceId, ...settings }) => ({
        url: `${serviceId}/settings/`,
        method: 'POST',
        data: settings,
      }),
      invalidatesTags: ['Service'],
    }),
    updateServiceSettings: builder.mutation({
      query: ({ serviceId, ...settings }) => ({
        url: `${serviceId}/settings/`,
        method: 'PUT',
        data: settings,
      }),
      invalidatesTags: ['Service'],
    }),
    autoMapPackages: builder.mutation({
      query: (serviceId) => ({
        url: `${serviceId}/auto-map-packages/`,
        method: 'POST',
      }),
    }),
    getBasePrices: builder.query({
      query: (id) => ({ url: `${id}/mapped-sizes/` }),
      providesTags: ['Service'],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServiceByIdQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useCreateServiceSettingsMutation,
  useUpdateServiceSettingsMutation,
  useAutoMapPackagesMutation,
  useGetBasePricesQuery,
  useEditServiceMutation,
} = servicesApi;