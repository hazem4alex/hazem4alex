import client from './client';

export const uploadFile = (documentId: number, file: File) => {
  const form = new FormData();
  form.append('documentId', String(documentId));
  form.append('file', file);
  return client.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

export const deleteFile = (id: number) => client.delete(`/files/${id}`);

export const getFileUrl = (id: number) => `/api/files/${id}`;
