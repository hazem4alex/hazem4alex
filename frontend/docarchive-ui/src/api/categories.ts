import client from './client';

export const getCategoryTree = () => client.get('/categories/tree').then((r) => r.data);
export const getCategory = (id: number) => client.get(`/categories/${id}`).then((r) => r.data);
export const createCategory = (data: object) => client.post('/categories', data).then((r) => r.data);
export const updateCategory = (id: number, data: object) => client.put(`/categories/${id}`, data).then((r) => r.data);
