import axiosClient from './axiosClient';

export const getOverview = (params) => axiosClient.get('/reports/overview', { params });
export const getProductivity = (params) => axiosClient.get('/reports/productivity', { params });

// User Activity report (defaults to all data when no from/to is passed)
export const getUserActivity = (params) => axiosClient.get('/reports/user-activity', { params });

// Downloads the PDF as a binary blob
export const getUserActivityPdf = (params) =>
  axiosClient.get('/reports/user-activity/pdf', { params, responseType: 'blob' });
