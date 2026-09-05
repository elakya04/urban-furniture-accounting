// Seed mock dataset mirroring backend Mongoose schemas and SVG wireframe demo data

export const initialUsers = [
  { _id: 'user_1', role: 'ADMIN', name: 'System Admin', email: 'admin@urbanfurniture.com', isActive: true },
  { _id: 'user_2', role: 'ACCOUNTANT', name: 'Chief Accountant', email: 'accountant@urbanfurniture.com', isActive: true },
  { _id: 'user_3', role: 'CONTACT', contact_id: 'CUSTOMER', name: 'Mr Raj', email: 'raj@example.com', isActive: true },
  { _id: 'user_4', role: 'CONTACT', contact_id: 'VENDOR', name: 'Mr Rahul', email: 'rahul@vendor.com', isActive: true }
];

export const initialContacts = [
  {
    _id: 'contact_1',
    name: 'Mr Rahul',
    userType: 'VENDOR',
    email: 'rahul@vendor.com',
    mobile: 9876543210,
    address: { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  },
  {
    _id: 'contact_2',
    name: 'Mr Raj',
    userType: 'CUSTOMER',
    email: 'raj@example.com',
    mobile: 9812345678,
    address: { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'
  },
  {
    _id: 'contact_3',
    name: 'Urban Woodcrafts Co',
    userType: 'BOTH',
    email: 'info@woodcrafts.com',
    mobile: 9988776655,
    address: { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
  }
];

export const initialProducts = [
  {
    _id: 'prod_1',
    productName: 'Air Conditioner',
    type: 'GOODS',
    salesPrice: 25000,
    cost: 15000,
    category: 'Electronics',
    isActive: true,
    stockQuantity: 15,
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400'
  },
  {
    _id: 'prod_2',
    productName: 'Refrigerator',
    type: 'GOODS',
    salesPrice: 10000,
    cost: 7000,
    category: 'Electronics',
    isActive: true,
    stockQuantity: 22,
    imageUrl: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400'
  },
  {
    _id: 'prod_3',
    productName: 'Executive Desk Chair',
    type: 'GOODS',
    salesPrice: 8500,
    cost: 5000,
    category: 'Furniture',
    isActive: true,
    stockQuantity: 40,
    imageUrl: 'https://images.unsplash.com/photo-1580481072645-022f9a6d1273?w=400'
  },
  {
    _id: 'prod_4',
    productName: 'Accounting & Consultation Service',
    type: 'SERVICE',
    salesPrice: 5000,
    cost: 0,
    category: 'Services',
    isActive: true,
    stockQuantity: 999,
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400'
  }
];

export const initialCOA = [
  { _id: 'coa_1', accountName: 'Asset A/c', type: 'ASSET', isActive: true },
  { _id: 'coa_2', accountName: 'Bank A/c', type: 'ASSET', isActive: true },
  { _id: 'coa_3', accountName: 'Cash A/c', type: 'ASSET', isActive: true },
  { _id: 'coa_4', accountName: 'Debtors A/c', type: 'ASSET', isActive: true },
  { _id: 'coa_5', accountName: 'Liability A/c', type: 'LIABILITY', isActive: true },
  { _id: 'coa_6', accountName: 'Creditors A/c', type: 'LIABILITY', isActive: true },
  { _id: 'coa_7', accountName: 'Capital A/c', type: 'CAPITAL', isActive: true },
  { _id: 'coa_8', accountName: 'Sales Income A/c', type: 'INCOME', isActive: true },
  { _id: 'coa_9', accountName: 'Purchase Expense A/c', type: 'EXPENSE', isActive: true },
  { _id: 'coa_10', accountName: 'Other Expense A/c', type: 'EXPENSE', isActive: true }
];

export const initialJournals = [
  { _id: 'j_1', journalName: 'Sales', type: 'SALES', def_debitAcc: 'coa_4', def_creditAcc: 'coa_8' },
  { _id: 'j_2', journalName: 'Purchases', type: 'PURCHASE', def_debitAcc: 'coa_9', def_creditAcc: 'coa_6' },
  { _id: 'j_3', journalName: 'Bank', type: 'BANK', def_debitAcc: 'coa_2', def_creditAcc: 'coa_2' },
  { _id: 'j_4', journalName: 'Cash', type: 'CASH', def_debitAcc: 'coa_3', def_creditAcc: 'coa_3' }
];

export const initialAnalyticsAccounts = [
  { _id: 'an_1', name: 'Furniture', type: 'EXPENSE' },
  { _id: 'an_2', name: 'Project 1', type: 'EXPENSE' },
  { _id: 'an_3', name: 'Office Expansion', type: 'INCOME' }
];

export const initialBudgets = [
  {
    _id: 'budget_1',
    name: 'January 2026',
    analytics_account: 'an_1',
    start_date: '2026-01-01',
    end_date: '2026-01-31',
    type: 'EXPENSE',
    committed_amount: 200000,
    status: 'CONFIRMED',
    responsiblePerson: 'user_1',
    revisionOf: null,
    revisedWith: null
  },
  {
    _id: 'budget_2',
    name: 'Project 1 Tech Deployment',
    analytics_account: 'an_2',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    type: 'EXPENSE',
    committed_amount: 150000,
    status: 'CONFIRMED',
    responsiblePerson: 'user_2',
    revisionOf: null,
    revisedWith: null
  }
];

export const initialSalesOrders = [
  {
    _id: 'so_1',
    so_number: 'S00001',
    customer: 'user_3',
    customerName: 'Mr Raj',
    date: '2026-01-10',
    total_amount: 25000,
    status: 'INVOICE',
    items: [
      { product: 'prod_1', productName: 'Air Conditioner', quantity: 1, unitPrice: 25000, tax: 0, total: 25000, budgetAnalytics: 'an_3', account: 'coa_8' }
    ]
  }
];

export const initialInvoices = [
  {
    _id: 'inv_1',
    inv_number: 'INV/2026/0001',
    sales: 'so_1',
    customerName: 'Mr Raj',
    invoice_date: '2026-01-10',
    due_date: '2026-01-25',
    total_amount: 25000,
    amount_paid: 25000,
    amount_due: 0,
    status: 'PAID',
    items: [
      { product: 'prod_1', productName: 'Air Conditioner', quantity: 1, unitPrice: 25000, tax: 0, total: 25000, budgetAnalytics: 'an_3', account: 'coa_8' }
    ]
  }
];

export const initialPurchaseOrders = [
  {
    _id: 'po_1',
    po_number: 'P00001',
    purchase_id: 1,
    vendor: 'contact_1',
    vendorName: 'Mr Rahul',
    date: '2026-01-05',
    total_amount: 14000,
    status: 'CONFIRMED',
    items: [
      { product: 'prod_2', productName: 'Refrigerator', quantity: 2, unitPrice: 7000, tax: 0, total: 14000, budgetAnalytics: 'an_1', account: 'coa_9' }
    ]
  }
];

export const initialVendorBills = [
  {
    _id: 'bill_1',
    bill_number: 'Bill/2026/0001',
    bill_reference: 'ABC-26-001',
    sales: 'po_1',
    vendor: 'contact_1',
    vendorName: 'Mr Rahul',
    bill_date: '2026-01-05',
    due_date: '2026-01-20',
    total: 30000,
    amount_paid: 10000,
    amount_due: 20000,
    status: 'DUE',
    items: [
      { product: 'prod_2', productName: 'Refrigerator', quantity: 3, unitPrice: 2000, tax: 0, total: 6000, budgetAnalytics: 'an_1', account: 'coa_9' },
      { product: 'prod_1', productName: 'Air Conditioner', quantity: 1, unitPrice: 24000, tax: 0, total: 24000, budgetAnalytics: 'an_1', account: 'coa_9' }
    ]
  }
];

export const initialPayments = [
  {
    _id: 'pay_1',
    invoiceBill: 'inv_1',
    partnerName: 'Mr Raj',
    payment_method: 'BANK',
    amount: 25000,
    type: 'RECEIVE',
    status: 'CONFIRM',
    date: '2026-01-12',
    note: 'Received for INV/2026/0001 via Bank transfer'
  },
  {
    _id: 'pay_2',
    vendorbill: 'bill_1',
    partnerName: 'Mr Rahul',
    payment_method: 'CASH',
    amount: 10000,
    type: 'SEND',
    status: 'CONFIRM',
    date: '2026-01-15',
    note: 'Partial payment paid via cash'
  }
];

export const initialJournalEntries = [
  {
    _id: 'je_1',
    number: 'Bill/2026/0001',
    date: '2026-01-05',
    partnerName: 'Mr Rahul',
    journal: 'j_2',
    journalName: 'Purchases',
    status: 'POSTED',
    sourceType: 'VENDOR_BILL',
    total: 30000,
    journalItems: [
      { account: 'coa_9', accountName: 'Purchase Expense A/c', partner: 'Mr Rahul', debit: 30000, credit: 0 },
      { account: 'coa_6', accountName: 'Creditors A/c', partner: 'Mr Rahul', debit: 0, credit: 30000 }
    ]
  },
  {
    _id: 'je_2',
    number: 'INV/2026/0001',
    date: '2026-01-10',
    partnerName: 'Mr Raj',
    journal: 'j_1',
    journalName: 'Sales',
    status: 'POSTED',
    sourceType: 'INVOICE',
    total: 25000,
    journalItems: [
      { account: 'coa_4', accountName: 'Debtors A/c', partner: 'Mr Raj', debit: 25000, credit: 0 },
      { account: 'coa_8', accountName: 'Sales Income A/c', partner: 'Mr Raj', debit: 0, credit: 25000 }
    ]
  }
];

export const initialAuditLogs = [
  { _id: 'log_1', action: 'CREATE_INVOICE', user: 'System Admin', details: 'Created customer invoice INV/2026/0001 for Rs. 25,000', timestamp: '2026-01-10T10:30:00Z' },
  { _id: 'log_2', action: 'POST_JOURNAL_ENTRY', user: 'Chief Accountant', details: 'Posted Journal Entry for Bill/2026/0001 (Balanced Rs. 30,000)', timestamp: '2026-01-05T14:15:00Z' },
  { _id: 'log_3', action: 'CONFIRM_BUDGET', user: 'System Admin', details: 'Confirmed Budget "January 2026" with committed amount Rs. 2,00,000', timestamp: '2026-01-01T09:00:00Z' }
];
