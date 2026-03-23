import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bch_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 - redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bch_token');
      localStorage.removeItem('bch_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Projects ─────────────────────────────────────────────────────
export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  my: () => api.get('/projects/my'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  updateStatus: (id, status) => api.patch(`/projects/${id}/status`, { status }),
  getMatches: (id) => api.get(`/projects/${id}/matches`),
};

// ── Bids ─────────────────────────────────────────────────────────
export const bidsAPI = {
  submit: (data) => api.post('/bids', data),
  accept: (id) => api.patch(`/bids/${id}/accept`),
  myBids: () => api.get('/bids/my'),
};

// ── Vendors ──────────────────────────────────────────────────────
export const vendorsAPI = {
  list: (params) => api.get('/vendors', { params }),
  get: (id) => api.get(`/vendors/${id}`),
  updateProfile: (data) => api.patch('/vendors/profile', data),
  addService: (data) => api.post('/vendors/services', data),
};

// ── Messages ─────────────────────────────────────────────────────
export const messagesAPI = {
  conversations: () => api.get('/messages/conversations'),
  thread: (userId) => api.get(`/messages/${userId}`),
  send: (data) => api.post('/messages', data),
};

// ── Transactions ─────────────────────────────────────────────────
export const transactionsAPI = {
  create: (data) => api.post('/transactions', data),
  release: (tid) => api.patch(`/transactions/${tid}/release`),
  my: () => api.get('/transactions/my'),
};

// ── Notifications ────────────────────────────────────────────────
export const notificationsAPI = {
  list: () => api.get('/notifications'),
  readAll: () => api.patch('/notifications/read-all'),
  read: (id) => api.patch(`/notifications/${id}/read`),
};

// ── Admin ────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  pendingVendors: () => api.get('/admin/vendors/pending'),
  verifyVendor: (id, status) => api.patch(`/admin/vendors/${id}/verify`, { status }),
  users: (params) => api.get('/admin/users', { params }),
  toggleUser: (uid) => api.patch(`/admin/users/${uid}/toggle`),
};

export const categoriesAPI = {
  list: () => api.get('/categories'),
};
