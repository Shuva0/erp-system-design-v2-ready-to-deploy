import axiosClient from './axiosClient';

export const getUsers = () => axiosClient.get('/users');
export const getUser = (id) => axiosClient.get(`/users/${id}`);
export const createUser = (data) => axiosClient.post('/users', data);
export const updateUserRole = (id, role) => axiosClient.patch(`/users/${id}/role`, { role });
export const assignDepartment = (id, service) => axiosClient.patch(`/users/${id}/department`, { service });
export const getUserTaskHistory = (id) => axiosClient.get(`/users/${id}/task-history`);
export const deactivateUser = (id) => axiosClient.delete(`/users/${id}`);
