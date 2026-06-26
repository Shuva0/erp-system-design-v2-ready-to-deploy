import axiosClient from './axiosClient';

export const getServices = () => axiosClient.get('/services');
export const createService = (data) => axiosClient.post('/services', data);
export const updateService = (id, data) => axiosClient.patch(`/services/${id}`, data);
export const deleteService = (id) => axiosClient.delete(`/services/${id}`);
