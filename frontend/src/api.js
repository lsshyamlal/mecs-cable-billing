import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) return Promise.reject(error);
      original._retry = true;
      isRefreshing = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        isRefreshing = false;
        return api(original);
      } catch {
        isRefreshing = false;
        localStorage.removeItem('mecs_auth');
        window.location.href = '/login?expired=1';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

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

export default api;
