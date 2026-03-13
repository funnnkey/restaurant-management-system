import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Menu API
export const menuAPI = {
  getCategories: () => api.get('/menu/categories'),
  createCategory: (data) => api.post('/menu/categories', data),
  updateCategory: (id, data) => api.put(`/menu/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/menu/categories/${id}`),
  getItems: (categoryId) => api.get(`/menu/items?categoryId=${categoryId}`),
  getAllItems: () => api.get('/menu/items'),
  createItem: (data) => api.post('/menu/items', data),
  updateItem: (id, data) => api.put(`/menu/items/${id}`, data),
  deleteItem: (id) => api.delete(`/menu/items/${id}`),
  toggleAvailability: (id) => api.put(`/menu/items/${id}/availability`),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  updatePayment: (id, data) => api.put(`/orders/${id}/payment`, data),
  cancel: (id) => api.delete(`/orders/${id}`),
  getTodayStats: () => api.get('/orders/stats/today'),
};

// Bills API
export const billsAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  generate: (data) => api.post('/bills/generate', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  getByOrder: (orderId) => api.get(`/bills/order/${orderId}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  getLowStock: () => api.get('/inventory/low-stock'),
  getById: (id) => api.get(`/inventory/${id}`),
  create: (data) => api.post('/inventory', data),
  update: (id, data) => api.put(`/inventory/${id}`, data),
  adjust: (id, data) => api.put(`/inventory/${id}/adjust`, data),
  delete: (id) => api.delete(`/inventory/${id}`),
  getStats: () => api.get('/inventory/stats/summary'),
};

// Reports API
export const reportsAPI = {
  getDaily: (date) => api.get('/reports/daily', { params: { date } }),
  getWeekly: (startDate) => api.get('/reports/weekly', { params: { startDate } }),
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getAnnual: (year) => api.get('/reports/annual', { params: { year } }),
  getTopItems: (params) => api.get('/reports/top-items', { params }),
  getSummary: () => api.get('/reports/summary'),
};

// Restaurants API
export const restaurantsAPI = {
  getAll: () => api.get('/restaurants'),
  getById: (id) => api.get(`/restaurants/${id}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
};
