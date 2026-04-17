import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Create Instance ──────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach Token ────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Token Refresh ─────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// ─── API Methods ──────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  logout: (data) => api.post('/auth/logout', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/change-password', data),
};

export const seekerAPI = {
  getProfile: () => api.get('/seekers/profile'),
  updateProfile: (data) => api.put('/seekers/profile', data),
  submitApplication: () => api.post('/seekers/submit-application'),
  getStatus: () => api.get('/seekers/my-status'),
  getNotifications: () => api.get('/seekers/notifications'),
  markNotificationsRead: () => api.patch('/seekers/mark-notifications-read'),
};

export const employerAPI = {
  getProfile: () => api.get('/employers/profile'),
  updateProfile: (data) => api.put('/employers/profile', data),
  createRequest: (data) => api.post('/employers/job-requests', data),
  getRequests: (params) => api.get('/employers/job-requests', { params }),
  getRequest: (id) => api.get(`/employers/job-requests/${id}`),
  cancelRequest: (id) => api.patch(`/employers/job-requests/${id}/cancel`),
  getDashboardStats: () => api.get('/employers/dashboard-stats'),
  getNotifications: () => api.get('/employers/notifications'),
  markNotificationsRead: () => api.patch('/employers/mark-notifications-read'),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getSeekers: (params) => api.get('/admin/seekers', { params }),
  getSeeker: (id) => api.get(`/admin/seekers/${id}`),
  updateSeekerStatus: (id, data) => api.patch(`/admin/seekers/${id}/status`, data),
  suspendUser: (id) => api.patch(`/admin/seekers/${id}/suspend`),
  getEmployers: (params) => api.get('/admin/employers', { params }),
  verifyEmployer: (id, data) => api.patch(`/admin/employers/${id}/verify`, data),
  getJobRequests: (params) => api.get('/admin/job-requests', { params }),
  updateRequestStatus: (id, data) => api.patch(`/admin/job-requests/${id}/status`, data),
  matchSeeker: (requestId, data) => api.post(`/admin/job-requests/${requestId}/match-seeker`, data),
  getSeekersForMatching: (params) => api.get('/admin/seekers-for-matching', { params }),
  broadcastNotification: (data) => api.post('/admin/broadcast-notification', data),
};

export const uploadAPI = {
  uploadAvatar: (formData) => api.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAvatar: () => api.delete('/upload/avatar'),
};

export default api;
