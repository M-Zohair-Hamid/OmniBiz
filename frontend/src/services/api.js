import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { handleOfflineRequest } from './offlineAdapter';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure offline standalone adapter for mobile & standalone mode
const isNative = Capacitor.isNativePlatform();
const isStandalone = true; // Fully functional offline standalone mode

if (isNative || isStandalone) {
  apiClient.defaults.adapter = async (config) => {
    try {
      let bodyData = config.data;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (e) {
          // keep as is
        }
      }
      const res = await handleOfflineRequest(
        config.method,
        config.url,
        bodyData,
        config.params || {}
      );
      return {
        data: res.data,
        status: res.status,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config,
        request: {}
      };
    } catch (err) {
      return Promise.reject({
        response: {
          status: 400,
          data: { error: err.message || 'Offline request error' }
        },
        message: err.message
      });
    }
  };
}

// Request interceptor - attach token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const companyCode = localStorage.getItem('selectedCompanyCode');
    const companyId = localStorage.getItem('selectedCompanyId');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const hasCompanyCode = config.headers['X-Company-Code'] || config.headers['x-company-code'];
    const hasCompanyId = config.headers['X-Company-Id'] || config.headers['x-company-id'];
    if (companyCode && !hasCompanyCode) {
      config.headers['X-Company-Code'] = companyCode;
    }
    if (companyId && !hasCompanyId) {
      config.headers['X-Company-Id'] = companyId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 422) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const api = apiClient;

// Dashboard
export const getDashboardData = () => api.get('/dashboard');

// Buyers
export const getBuyers = (page = 1, perPage = 10, search = '') =>
  api.get('/buyers', { params: { page, per_page: perPage, search } });
export const getBuyer = (id) => api.get(`/buyers/${id}`);
export const createBuyer = (data) => api.post('/buyers', data);
export const updateBuyer = (id, data) => api.put(`/buyers/${id}`, data);
export const deleteBuyer = (id) => api.delete(`/buyers/${id}`);

// Items
export const getItems = (page = 1, perPage = 10, search = '') =>
  api.get('/items', { params: { page, per_page: perPage, search } });
export const getItem = (id) => api.get(`/items/${id}`);
export const createItem = (data) => api.post('/items', data);
export const updateItem = (id, data) => api.put(`/items/${id}`, data);
export const deleteItem = (id) => api.delete(`/items/${id}`);

// Orders
export const getOrders = (page = 1, perPage = 10, status = '') =>
  api.get('/orders', { params: { page, per_page: perPage, status } });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const createOrder = (data) => api.post('/orders', data);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Payments
export const getPayments = (page = 1, perPage = 10) =>
  api.get('/payments', { params: { page, per_page: perPage } });
export const getPayment = (id) => api.get(`/payments/${id}`);
export const createPayment = (data) => api.post('/payments', data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);
export const getOrderPayments = (orderId) => api.get(`/payments/order/${orderId}`);

// Reports
export const getReportSummary = () => api.get('/reports/summary');
export const getPaymentStatusReport = () => api.get('/reports/payment-status');
export const getBuyerWiseReport = () => api.get('/reports/buyer-wise');
export const getItemWiseReport = () => api.get('/reports/item-wise');
export const getOrdersReport = (startDate = '', endDate = '', buyerId = '', status = '') =>
  api.get('/reports/orders', { params: { start_date: startDate, end_date: endDate, buyer_id: buyerId, status } });
export const exportOrdersCsv = (startDate = '', endDate = '') =>
  api.get('/reports/orders/export-csv', { params: { start_date: startDate, end_date: endDate }, responseType: 'blob' });

// Ledgers
export const getLedger = (buyerId, startDate = '', endDate = '') =>
  api.get(`/ledgers/${buyerId}`, { params: { start_date: startDate, end_date: endDate } });
export const downloadLedgerPdf = (buyerId, startDate = '', endDate = '') =>
  api.get(`/ledgers/${buyerId}/pdf`, { params: { start_date: startDate, end_date: endDate }, responseType: 'blob' });

export default api;
