import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - attach token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const companyCode = localStorage.getItem('selectedCompanyCode');
    const companyId = localStorage.getItem('selectedCompanyId');
    console.log('API Request:', config.method.toUpperCase(), config.url, 'Token:', token ? 'Present' : 'MISSING');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (companyCode) {
      config.headers['X-Company-Code'] = companyCode;
    }
    if (companyId) {
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
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.status === 422) {
      // Token expired or invalid
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

// Invoices
export const getInvoices = (page = 1, perPage = 10, status = '') =>
  api.get('/invoices', { params: { page, per_page: perPage, status } });
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (data) => api.post('/invoices', data);
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);
export const downloadInvoicePdf = (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });

// Payments
export const getPayments = (page = 1, perPage = 10) =>
  api.get('/payments', { params: { page, per_page: perPage } });
export const getPayment = (id) => api.get(`/payments/${id}`);
export const createPayment = (data) => api.post('/payments', data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);

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
