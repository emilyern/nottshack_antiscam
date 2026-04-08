// =============================================================
// src/utils/api.js
// Centralized API client for DashGuard backend.
// All frontend ↔ backend communication goes through here.
// =============================================================

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with base config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dashguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (token expired) globally
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

// ---- Auth ----
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ---- Wallet ----
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (from = 0, to = 20) =>
    api.get(`/wallet/transactions?from=${from}&to=${to}`),
  getHistory: () => api.get('/wallet/history'),
};

// ---- Risk ----
export const riskAPI = {
  analyze: (address) => api.post('/risk/analyze', { address }),
  getReport: (address) => api.get(`/risk/report/${address}`),
};

// ---- Transactions ----
export const transactionAPI = {
  send: (data) => api.post('/transactions/send', data),
  getStatus: (txid) => api.get(`/transactions/${txid}`),
};

// ---- Health ----
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
