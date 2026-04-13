import client from './client';

export const getUsers = () => client.get('/users').then((r) => r.data);
export const getUser = (id: number) => client.get(`/users/${id}`).then((r) => r.data);
export const createUser = (data: object) => client.post('/users', data).then((r) => r.data);
export const updateUser = (id: number, data: object) => client.put(`/users/${id}`, data).then((r) => r.data);
export const deleteUser = (id: number) => client.delete(`/users/${id}`);
// Admin changing any user's password
export const changeUserPassword = (id: number, newPassword: string) =>
  client.put(`/users/${id}/password`, { newPassword });

// Self-service: any logged-in user changing their own password
export const changeOwnPassword = (newPassword: string) =>
  client.put('/auth/change-password', { newPassword });
