import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery, BASE_URL } from '../axios/axios';

export const questionSubQuestionsApi = createApi({
  reducerPath: 'questionSubQuestionsApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL + '/service/sub-questions/'}),
  tagTypes: ['Sub-Question'],
  endpoints: (builder) => ({
    createQuestionSubQuestion: builder.mutation({
      query: (data) => ({
        url: '',
        method: 'POST',
        data: data,
      }),
      invalidatesTags: ['Sub-Question'],
    }),
    updateQuestionSubQuestion: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${id}/`,
        method: 'PUT',
        data: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Sub-Question', id }],
    }),
    deleteQuestionSubQuestion: builder.mutation({
      query: (id) => ({
        url: `${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Sub-Question'],
    }),
  }),
});

export const {
  useCreateQuestionSubQuestionMutation,
  useUpdateQuestionSubQuestionMutation,
  useDeleteQuestionSubQuestionMutation
} = questionSubQuestionsApi;