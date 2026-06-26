import axiosClient from './axiosClient';

export const getOverview = (params) => axiosClient.get('/reports/overview', { params });
export const getProductivity = (params) => axiosClient.get('/reports/productivity', { params });
