import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve());
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => {
    localStorage.setItem('mecs_last_activity', String(Date.now()));
    return res;
  },
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/login') {
      if (isRefreshing) {
        // Queue this request; retry it once the in-flight refresh completes.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          original._retry = true;
          return api(original);
        }).catch(Promise.reject);
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        isRefreshing = false;
        processQueue(null);
        return api(original);
      } catch (err) {
        isRefreshing = false;
        processQueue(err);
        const stored = localStorage.getItem('mecs_auth');
        const name = stored ? JSON.parse(stored).name : null;
        localStorage.removeItem('mecs_auth');
        const params = new URLSearchParams({ expired: '1' });
        if (name) params.set('user', name);
        window.location.href = `/login?${params}`;
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Bypasses the response interceptor so it doesn't update lastActivityAt or trigger the retry loop.
export const ping = () =>
  axios.get('/api/auth/ping', { withCredentials: true });

export const login = (identifier, password) =>
  api.post('/auth/login', { identifier, password });

export const logout = () =>
  api.post('/auth/logout');

export const getProfile = () =>
  api.get('/portal/me');

export const getCurrentSubscription = () =>
  api.get('/portal/me/subscription/current');

export const getSubscriptionHistory = () =>
  api.get('/portal/me/subscription/history');

// ── Areas ────────────────────────────────────────────────────
export const getAreas = () => api.get('/areas');
export const createArea = (data) => api.post('/areas', data);

// ── Customers ────────────────────────────────────────────────
export const listCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const closeAccount = (id) => api.put(`/customers/${id}/close-account`);
export const reEnrollCustomer = (id, data) => api.put(`/customers/${id}/reenroll`, data);
export const resetCustomerPassword = (id, data) => api.put(`/customers/${id}/reset-password`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// ── Payments ─────────────────────────────────────────────────
export const recordPayment = (customerId, data) => api.post(`/payments/${customerId}`, data);
export const listPaymentsByCustomer = (customerId) => api.get(`/payments/${customerId}`);
export const listAllPayments = (params) => api.get('/payments', { params });

// ── Reports ──────────────────────────────────────────────────
export const getPaymentReport = (params) => api.get('/reports/payments', { params });
export const getCustomerReport = (params) => api.get('/reports/customers', { params });
export const exportReportUrl = (path, params) => {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)));
  return `/api/${path}?${qs}`;
};

// ── Admin ────────────────────────────────────────────────────
export const runScheduler = () => api.post('/admin/scheduler/run');
export const getAdminProfile = () => api.get('/admin/me');
export const updateAdminProfile = (data) => api.put('/admin/me', data);
export const changeAdminPassword = (data) => api.put('/admin/me/password', data);

export default api;
