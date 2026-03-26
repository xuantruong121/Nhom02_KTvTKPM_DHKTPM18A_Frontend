import axios from 'axios';

const staffApiClient = axios.create({
  baseURL: import.meta.env.VITE_STAFF_API_URL ?? 'http://localhost:8080/api/staff',
  timeout: 10000,
});

staffApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

staffApiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwtToken');
      window.location.href = '/staff/login';
    }
    return Promise.reject(error);
  },
);

export default staffApiClient;
