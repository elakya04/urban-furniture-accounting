// Unified API Service Layer targeting all 25+ specified endpoints

const BASE_URL = '/api';

async function fetchJSON(url, options = {}, throwOnError = false) {
  try {
    const token = localStorage.getItem('uf_token');
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    console.log(`[API REQUEST] ${options.method || 'GET'} ${BASE_URL}${url}`);
    const res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn(`[API ERROR] ${options.method || 'GET'} ${BASE_URL}${url} -> ${res.status}:`, data.message);
      const err = new Error(data.message || `API Error: ${res.status}`);
      err.status = res.status;
      if (throwOnError) throw err;
      return null;
    }

    console.log(`[API SUCCESS] ${options.method || 'GET'} ${BASE_URL}${url}`, data);
    return data;
  } catch (err) {
    if (throwOnError) throw err;
    console.warn(`[API Client Warning] Backend endpoint ${url} unavailable:`, err.message);
    return null;
  }
}

export const api = {
  // Authentication
  login: (credentials) => fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }, true),
  register: (userData) => fetchJSON('/auth/register', { method: 'POST', body: JSON.stringify(userData) }, true),
  logout: () => fetchJSON('/auth/logout', { method: 'POST' }),
  getMe: () => fetchJSON('/auth/me', { method: 'GET' }),

  // Users
  getUsers: () => fetchJSON('/users'),
  getUserById: (id) => fetchJSON(`/users/${id}`),
  updateUser: (id, data) => fetchJSON(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateUserStatus: (id, status) => fetchJSON(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Contacts
  getContacts: () => fetchJSON('/contacts'),
  getContactById: (id) => fetchJSON(`/contacts/${id}`),
  createContact: (data) => fetchJSON('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => fetchJSON(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archiveContact: (id) => fetchJSON(`/contacts/${id}/archive`, { method: 'POST' }),
  getContactTransactions: (id) => fetchJSON(`/contacts/${id}/transactions`),

  // Products
  getProducts: () => fetchJSON('/products'),
  getProductById: (id) => fetchJSON(`/products/${id}`),
  createProduct: (data) => fetchJSON('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => fetchJSON(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archiveProduct: (id) => fetchJSON(`/products/${id}/archive`, { method: 'POST' }),
  uploadProductImage: (id, formData) => fetchJSON(`/products/${id}/image`, { method: 'POST', body: formData }),

  // Chart of Accounts (COA)
  getAccounts: (params = '') => fetchJSON(`/accounts${params ? `?${params}` : ''}`),
  getAccountById: (id) => fetchJSON(`/accounts/${id}`),
  createAccount: (data) => fetchJSON('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id, data) => fetchJSON(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateAccountStatus: (id, isActive) => fetchJSON(`/accounts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  archiveAccount: (id) => fetchJSON(`/accounts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) }),
  getAccountLedger: (id) => fetchJSON(`/accounts/${id}/ledger`),

  // Journals
  getJournals: () => fetchJSON('/journals'),
  getJournalById: (id) => fetchJSON(`/journals/${id}`),
  createJournal: (data) => fetchJSON('/journals', { method: 'POST', body: JSON.stringify(data) }),
  updateJournal: (id, data) => fetchJSON(`/journals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Analytic Accounts
  getAnalyticAccounts: () => fetchJSON('/analytic-accounts'),
  getAnalyticAccountById: (id) => fetchJSON(`/analytic-accounts/${id}`),
  createAnalyticAccount: (data) => fetchJSON('/analytic-accounts', { method: 'POST', body: JSON.stringify(data) }),
  updateAnalyticAccount: (id, data) => fetchJSON(`/analytic-accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  archiveAnalyticAccount: (id) => fetchJSON(`/analytic-accounts/${id}/archive`, { method: 'POST' }),

  // Sales Orders
  getSalesOrders: () => fetchJSON('/sales-orders'),
  getSalesOrderById: (id) => fetchJSON(`/sales-orders/${id}`),
  createSalesOrder: (data) => fetchJSON('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateSalesOrder: (id, data) => fetchJSON(`/sales-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  confirmSalesOrder: (id) => fetchJSON(`/sales-orders/${id}/confirm`, { method: 'POST' }),
  cancelSalesOrder: (id) => fetchJSON(`/sales-orders/${id}/cancel`, { method: 'POST' }),
  createInvoiceFromSO: (id) => fetchJSON(`/sales-orders/${id}/invoice`, { method: 'POST' }),

  // Customer Invoices
  getInvoices: () => fetchJSON('/invoices'),
  getInvoiceById: (id) => fetchJSON(`/invoices/${id}`),
  confirmInvoice: (id) => fetchJSON(`/invoices/${id}/confirm`, { method: 'POST' }),
  cancelInvoice: (id) => fetchJSON(`/invoices/${id}/cancel`, { method: 'POST' }),
  getInvoicePayments: (id) => fetchJSON(`/invoices/${id}/payments`),
  getInvoicePDF: (id) => fetchJSON(`/invoices/${id}/pdf`),

  // Customer Self-Service
  getMyInvoices: () => fetchJSON('/me/invoices'),
  getMyInvoiceById: (id) => fetchJSON(`/me/invoices/${id}`),

  // Purchase Orders
  getPurchaseOrders: () => fetchJSON('/purchase-orders'),
  getPurchaseOrderById: (id) => fetchJSON(`/purchase-orders/${id}`),
  createPurchaseOrder: (data) => fetchJSON('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchaseOrder: (id, data) => fetchJSON(`/purchase-orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  confirmPurchaseOrder: (id) => fetchJSON(`/purchase-orders/${id}/confirm`, { method: 'POST' }),
  cancelPurchaseOrder: (id) => fetchJSON(`/purchase-orders/${id}/cancel`, { method: 'POST' }),
  createVendorBillFromPO: (id) => fetchJSON(`/purchase-orders/${id}/vendor-bill`, { method: 'POST' }),

  // Vendor Bills
  getVendorBills: () => fetchJSON('/vendor-bills'),
  getVendorBillById: (id) => fetchJSON(`/vendor-bills/${id}`),
  confirmVendorBill: (id) => fetchJSON(`/vendor-bills/${id}/confirm`, { method: 'POST' }),
  cancelVendorBill: (id) => fetchJSON(`/vendor-bills/${id}/cancel`, { method: 'POST' }),
  getVendorBillPayments: (id) => fetchJSON(`/vendor-bills/${id}/payments`),
  getVendorBillPDF: (id) => fetchJSON(`/vendor-bills/${id}/pdf`),

  // Vendor Self-Service
  getMyVendorBills: () => fetchJSON('/me/vendor-bills'),
  getMyVendorBillById: (id) => fetchJSON(`/me/vendor-bills/${id}`),

  // Payments
  getPayments: () => fetchJSON('/payments'),
  getPaymentById: (id) => fetchJSON(`/payments/${id}`),
  createPayment: (data) => fetchJSON('/payments', { method: 'POST', body: JSON.stringify(data) }),
  confirmPayment: (id) => fetchJSON(`/payments/${id}/confirm`, { method: 'POST' }),
  cancelPayment: (id) => fetchJSON(`/payments/${id}/cancel`, { method: 'POST' }),

  // Journal Entries
  getJournalEntries: () => fetchJSON('/journal-entries'),
  getJournalEntryById: (id) => fetchJSON(`/journal-entries/${id}`),
  createJournalEntry: (data) => fetchJSON('/journal-entries', { method: 'POST', body: JSON.stringify(data) }),
  reverseJournalEntry: (id) => fetchJSON(`/journal-entries/${id}/reverse`, { method: 'POST' }),

  // General Ledger
  getLedger: () => fetchJSON('/ledger'),

  // Budgets
  getBudgets: () => fetchJSON('/budgets'),
  getBudgetById: (id) => fetchJSON(`/budgets/${id}`),
  createBudget: (data) => fetchJSON('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  updateBudget: (id, data) => fetchJSON(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  confirmBudget: (id) => fetchJSON(`/budgets/${id}/confirm`, { method: 'POST' }),
  reviseBudget: (id, revisionData) => fetchJSON(`/budgets/${id}/revise`, { method: 'POST', body: JSON.stringify(revisionData) }),
  cancelBudget: (id) => fetchJSON(`/budgets/${id}/cancel`, { method: 'POST' }),
  getBudgetReport: (id) => fetchJSON(`/budgets/${id}/report`),

  // Stock
  getStock: () => fetchJSON('/stock'),
  getStockMovements: (productId) => fetchJSON(`/stock/${productId}/movements`),
  createStockAdjustment: (data) => fetchJSON('/stock/adjustments', { method: 'POST', body: JSON.stringify(data) }),

  // Financial Reports
  getProfitLossReport: () => fetchJSON('/reports/profit-loss'),
  getBalanceSheetReport: () => fetchJSON('/reports/balance-sheet'),
  getBudgetSummaryReport: () => fetchJSON('/reports/budget'),
  getStockReport: () => fetchJSON('/reports/stock'),

  // Dashboard Summary
  getDashboardSummary: () => fetchJSON('/dashboard/summary'),

  // File Upload
  uploadImage: (formData) => fetchJSON('/uploads/image', { method: 'POST', body: formData }),

  // Audit Logs
  getAuditLogs: () => fetchJSON('/audit-logs'),

  // Global Search
  globalSearch: (query) => fetchJSON(`/search?q=${encodeURIComponent(query)}`)
};
