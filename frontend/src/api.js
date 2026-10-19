const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getProfile: (userId) => request(`/auth/profile/${userId}`),
  updateProfile: (userId, payload) =>
    request(`/auth/profile/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Products & Catalog
  getProducts: (query = '', categoryId = 0, brandId = 0) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (categoryId) params.append('categoryId', categoryId);
    if (brandId) params.append('brandId', brandId);
    return request(`/products?${params.toString()}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  getCategories: () => request('/products/categories'),
  getBrands: () => request('/products/brands'),
  getLowStockAlerts: () => request('/products/alerts'),
  restockProduct: (userId, productId, additionalStock) =>
    request('/products/restock', {
      method: 'POST',
      body: JSON.stringify({ userId, productId, additionalStock }),
    }),
  addProduct: (product) =>
    request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),

  // Coupons
  getActiveCoupons: () => request('/coupons/active'),
  getAllCoupons: () => request('/coupons'),
  validateCoupon: (code, subtotal) => {
    const params = new URLSearchParams({ code, subtotal });
    return request(`/coupons/validate?${params.toString()}`, { method: 'POST' });
  },
  createCoupon: (payload) =>
    request('/coupons', { method: 'POST', body: JSON.stringify(payload) }),
  toggleCoupon: (id, active) =>
    request(`/coupons/${id}/toggle?active=${active}`, { method: 'PATCH' }),

  // Addresses
  getUserAddresses: (userId) => request(`/addresses/user/${userId}`),
  addAddress: (payload) =>
    request('/addresses', { method: 'POST', body: JSON.stringify(payload) }),

  // Orders
  checkout: (payload) =>
    request('/orders/checkout', { method: 'POST', body: JSON.stringify(payload) }),
  getCustomerOrders: (userId) => request(`/orders/customer/${userId}`),
  getAllOrders: () => request('/orders'),
  getOrderDetails: (id) => request(`/orders/${id}`),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PATCH' }),

  // Admin
  getKpis: () => request('/admin/analytics/kpis'),
  getDailySales: () => request('/admin/analytics/daily-sales'),
  getTopSelling: () => request('/admin/analytics/top-selling'),
  getAuditLogs: (limit = 50) => request(`/admin/audit-logs?limit=${limit}`),
  getManagers: () => request('/admin/managers'),
  createManager: (adminId, payload) =>
    request(`/admin/managers?adminId=${adminId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  toggleManager: (id, active) =>
    request(`/admin/managers/${id}/toggle?active=${active}`, { method: 'PATCH' }),
  getMonthlyReport: (year, month) =>
    request(`/admin/monthly-report?year=${year}&month=${month}`),
};
