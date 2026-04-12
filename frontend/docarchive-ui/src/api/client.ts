import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const stored = localStorage.getItem('docarchive-auth');
  if (stored) {
    const parsed = JSON.parse(stored);
    const token = parsed?.state?.user?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('docarchive-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
