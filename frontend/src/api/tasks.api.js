import axiosClient from './axiosClient';

export const getTasks = (params) => axiosClient.get('/tasks', { params });
export const getTask = (id) => axiosClient.get(`/tasks/${id}`);
export const createTask = (data) => axiosClient.post('/tasks', data);
export const updateTask = (id, data) => axiosClient.patch(`/tasks/${id}`, data);
export const completeTask = (id) => axiosClient.patch(`/tasks/${id}/complete`);
export const deleteTask = (id) => axiosClient.delete(`/tasks/${id}`);
