import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dashguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dashguard_token');
      localStorage.removeItem('dashguard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  // Fixed: /wallet/transactions doesn't exist, use /wallet/history
  getHistory: () => api.get('/wallet/history'),
};

export const riskAPI = {
  analyze:   (address) => api.post('/risk/analyze', { address }),
  getReport: (address) => api.get(`/risk/report/${address}`),
};

export const transactionAPI = {
  send:      (data) => api.post('/transactions/send', data),
  getStatus: (txid) => api.get(`/transactions/${txid}`),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;