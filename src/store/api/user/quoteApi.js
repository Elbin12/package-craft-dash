import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../../axios/axios';

export const quoteApi = createApi({
  reducerPath: 'quoteApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/quote/' }),
  tagTypes: ['quote'],
  endpoints: (builder) => ({
    getInitialData: builder.query({
        query: (type)=>({url:'initial-data/', 
          params: { property_type: type }
        }),
        providesTags: ['quote'],
    }),
    getServiceQuestions: builder.query({
        query: (id)=>({url:`services/${id}/questions/`}),
        providesTags: ['quote'],
    }),
    createSubmission: builder.mutation({
      query: (contactData) => ({
        url: 'create-submission/',
        method: 'POST',
        data: contactData,
      }),
      invalidatesTags: ['Submission'],
    }), 
    updateSubmission: builder.mutation({
      query: ({ id, ...contactData }) => ({
        url: `${id}/`,
        method: 'PATCH',
        data: contactData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Submission', id }],
    }),
    createQuestionResponses: builder.mutation({
      query: ({submissionId, serviceId, payload}) => ({
        url: `${submissionId}/services/${serviceId}/responses/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    updateQuestionResponsesForSubmitted: builder.mutation({
      query: ({submissionId, serviceId, payload}) => ({
        url: `${submissionId}/services/${serviceId}/responses/edit/`,
        method: 'PUT',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    createServiceToSubmission: builder.mutation({
      query: ({submissionId, payload}) => ({
        url: `${submissionId}/add-services/`,
        method: 'POST',
        data: payload,
      }),
    }),
    getQuoteDetails: builder.query({
        query: (id)=>({url:`${id}/`}),
        providesTags: ['quote', 'Details'],
    }),
    submitQuote: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `${submissionId}/submit/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    getAddons: builder.query({
        query: ()=>({url:'addons/'}),
        providesTags: ['addons'],
    }),
    addAddons: builder.mutation({
      query: ({ submissionId, addons }) => ({
        url: `submissions/${submissionId}/addons/`,
        method: 'POST',
        data: {"addons":addons},
      }),
      invalidatesTags: ['Add addons'],
    }),
    deleteAddons: builder.mutation({
      query: ({submissionId, addon_ids}) => ({
        url: `submissions/${submissionId}/addons/`,
        method: 'DELETE',
        data: { addon_ids }
      }),
      invalidatesTags: ['addons'],
    }),
    DeclineQuote: builder.mutation({
      query: ({ submissionId }) => ({
        url: `submissions/${submissionId}/decline/`,
        method: 'POST',
        // Add any required body parameters if needed
      }),
      invalidatesTags: ['Quote'], // Adjust tags as needed
    }),
    applyCoupon: builder.mutation({
      query: ({ submission_id, code, amount }) => ({
        url: 'coupons-apply/',
        method: 'POST',
        data: {
          submission_id,
          code,
          amount,
        },
      }),
      invalidatesTags: ['Quote'],
    }),
    addAvailabilities: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `submissions/${submissionId}/availability/`,
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    getGlobalCoupons: builder.query({
      query: () => ({ url: 'coupons/global/' }),
      providesTags: ['Coupons'],
    }),
    addNotes: builder.mutation({
      query: ({ submissionId, payload }) => ({
        url: `${submissionId}/notes/`,
        method: 'PATCH',
        data: payload,
      }),
      invalidatesTags: ['Quote', 'Submission'],
    }),
    
    editPackagePrice: builder.mutation({
      query: ({ packageId, payload }) => ({
        url: `package-quotes/${packageId}/price/`,
        method: 'PATCH',
        data: payload,
      }),
    }),
  }),
});

export const { useGetInitialDataQuery, useGetServiceQuestionsQuery, useCreateSubmissionMutation, useUpdateSubmissionMutation, useCreateQuestionResponsesMutation,
  useCreateServiceToSubmissionMutation,   useGetQuoteDetailsQuery,useSubmitQuoteMutation, useGetAddonsQuery, useAddAddonsMutation, useDeleteAddonsMutation,
  useDeclineQuoteMutation, useApplyCouponMutation, useAddAvailabilitiesMutation, useUpdateQuestionResponsesForSubmittedMutation,
  useGetGlobalCouponsQuery, useAddNotesMutation, useEditPackagePriceMutation
 } = quoteApi;
