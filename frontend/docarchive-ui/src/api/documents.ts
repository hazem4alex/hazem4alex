import client from './client';

export const createDocument = (data: object) => client.post('/documents', data).then((r) => r.data);
export const getDocument = (id: number) => client.get(`/documents/${id}`).then((r) => r.data);
export const updateDocument = (id: number, data: object) => client.put(`/documents/${id}`, data).then((r) => r.data);
export const deleteDocument = (id: number) => client.delete(`/documents/${id}`);
export const searchDocuments = (data: object) => client.post('/documents/search', data).then((r) => r.data);
export const getDocumentHistory = (id: number) => client.get(`/documents/${id}/history`).then((r) => r.data);
