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

const PREVIEWABLE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
  'text/plain', 'text/html', 'text/csv',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/ogg', 'audio/wav',
]);

export const isPreviewable = (mimeType: string): boolean =>
  PREVIEWABLE_MIME_TYPES.has(mimeType) || mimeType.startsWith('image/') || mimeType.startsWith('text/');

export const openFileInNewTab = async (id: number, mimeType: string): Promise<void> => {
  const response = await client.get(`/files/${id}`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  // Delay revoke to allow the new tab to load
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
