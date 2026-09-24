// LUISCART API Client

const API = {
  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const config = {
        method: options.method || 'GET',
        headers,
        ...options
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(endpoint, config);

      if (!response.ok) {
        let errData;
        try {
          errData = await response.json();
        } catch {
          errData = { error: response.statusText };
        }
        throw new Error(errData.error || 'Request failed');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (err) {
      console.error(`API Error on [${endpoint}]:`, err);
      Utils.showToast(err.message, 'error');
      throw err;
    }
  },

  // Dashboard
  async getDashboard(period = '30d', start, end) {
    const params = new URLSearchParams({ period });
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const res = await this.request(`/api/dashboard?${params.toString()}`);
    return res.data;
  },

  // Orders
  async getOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return await this.request(`/api/orders?${qs}`);
  },

  async getOrder(id) {
    const res = await this.request(`/api/orders/${id}`);
    return res.data;
  },

  async updateOrderStatus(id, status, note) {
    const res = await this.request(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: { status, note }
    });
    return res.data;
  },

  async updateOrderTracking(id, data) {
    const res = await this.request(`/api/orders/${id}/tracking`, {
      method: 'PUT',
      body: data
    });
    return res.data;
  },

  async pushToSupplier(id, supplierName) {
    const res = await this.request(`/api/orders/${id}/push-supplier`, {
      method: 'POST',
      body: { supplier_name: supplierName }
    });
    return res.data;
  },

  async verifyCod(id, verified) {
    const res = await this.request(`/api/orders/${id}/verify-cod`, {
      method: 'PUT',
      body: { verified }
    });
    return res.data;
  },

  async getSuppliersHub() {
    const res = await this.request('/api/suppliers/hub');
    return res.data;
  },

  async bulkPushSuppliers(orderIds) {
    const res = await this.request('/api/suppliers/bulk-push', {
      method: 'POST',
      body: { order_ids: orderIds }
    });
    return res.data;
  },

  async refundOrder(id, data) {
    const res = await this.request(`/api/orders/${id}/refund`, {
      method: 'POST',
      body: data
    });
    return res.data;
  },

  async addOrderNote(id, note) {
    const res = await this.request(`/api/orders/${id}/notes`, {
      method: 'POST',
      body: { note }
    });
    return res.data;
  },

  async createOrder(data) {
    const res = await this.request('/api/orders', {
      method: 'POST',
      body: data
    });
    return res.data;
  },

  // Customers
  async getCustomers(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return await this.request(`/api/customers?${qs}`);
  },

  async getCustomer(id) {
    const res = await this.request(`/api/customers/${id}`);
    return res.data;
  },

  async updateCustomer(id, data) {
    const res = await this.request(`/api/customers/${id}`, {
      method: 'PUT',
      body: data
    });
    return res.data;
  },

  // Products
  async getProducts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return await this.request(`/api/products?${qs}`);
  },

  async addProduct(data) {
    const res = await this.request('/api/products', {
      method: 'POST',
      body: data
    });
    return res.data;
  },

  async updateProduct(id, data) {
    const res = await this.request(`/api/products/${id}`, {
      method: 'PUT',
      body: data
    });
    return res.data;
  },

  async adjustStock(id, data) {
    const res = await this.request(`/api/products/${id}/stock`, {
      method: 'PUT',
      body: data
    });
    return res.data;
  },

  async getInventoryLogs() {
    const res = await this.request('/api/products/inventory/logs');
    return res.data;
  },

  // Shipping
  async getShippingHub() {
    const res = await this.request('/api/shipping/hub');
    return res.data;
  },

  // Finance
  async getProfitAndLoss(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await this.request(`/api/finance/pnl?${qs}`);
    return res.data;
  },

  async addExpense(data) {
    const res = await this.request('/api/finance/expenses', {
      method: 'POST',
      body: data
    });
    return res.data;
  },

  async getInvoices(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await this.request(`/api/finance/invoices?${qs}`);
    return res.data;
  },

  // Coupons
  async getCoupons() {
    const res = await this.request('/api/coupons');
    return res.data;
  },

  async createCoupon(data) {
    const res = await this.request('/api/coupons', {
      method: 'POST',
      body: data
    });
    return res.data;
  },

  async toggleCoupon(id) {
    const res = await this.request(`/api/coupons/${id}/toggle`, {
      method: 'PUT'
    });
    return res.data;
  },

  // Security & App PIN Lock
  async getSecurityStatus() {
    return await this.request('/api/security/status');
  },

  async setupPin(pin) {
    return await this.request('/api/security/setup', {
      method: 'POST',
      body: { pin }
    });
  },

  async verifyPin(pin) {
    return await this.request('/api/security/verify', {
      method: 'POST',
      body: { pin }
    });
  },

  async changePin(currentPin, newPin) {
    return await this.request('/api/security/change', {
      method: 'POST',
      body: { currentPin, newPin }
    });
  },

  async togglePin(enabled, pin) {
    return await this.request('/api/security/toggle', {
      method: 'POST',
      body: { enabled, pin }
    });
  },

  async resetPin() {
    return await this.request('/api/security/reset', {
      method: 'POST'
    });
  },

  // Settings & Reset
  async getSettings() {
    const res = await this.request('/api/settings');
    return res.data;
  },

  async updateSettings(data) {
    const res = await this.request('/api/settings', {
      method: 'PUT',
      body: data
    });
    return res;
  },

  async resetDemoData() {
    const res = await this.request('/api/seed', {
      method: 'POST'
    });
    return res;
  },

  async resetData() {
    return await this.resetDemoData();
  }
};
