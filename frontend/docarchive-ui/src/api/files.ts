import client from './client';

export const uploadFile = (documentId: number, file: File) => {
  const form = new FormData();
  form.append('documentId', String(documentId));
  form.append('file', file);
  return client.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};

export const deleteFile = (id: number) => client.delete(`/files/${id}`);

export const downloadFile = async (id: number, filename: string): Promise<void> => {
  const response = await client.get(`/files/${id}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
