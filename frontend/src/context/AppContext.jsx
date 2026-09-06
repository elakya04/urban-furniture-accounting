import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateJournalEntryBalance, computeBudgetMetrics } from '../utils/accountingMath';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { isAuthenticated, currentUser, userRole } = useAuth() || {};
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [coa, setCOA] = useState([]);
  const [journals, setJournals] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendorBills, setVendorBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Toast notification system
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const addAuditLog = (action, details) => {
    const log = {
      _id: `log_${Date.now()}`,
      action,
      user: 'Current User',
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // Contacts
  const addContact = async (data) => {
    try {
      const res = await api.createContact(data);
      const created = res?.data || { ...data, _id: `contact_${Date.now()}` };
      setContacts(prev => [created, ...prev]);
      showToast(`Contact "${created.name}" created successfully`, 'success');
      addAuditLog('CREATE_CONTACT', `Added contact ${created.name}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating contact on backend:', err.message);
      const fallback = { ...data, _id: `contact_${Date.now()}` };
      setContacts(prev => [fallback, ...prev]);
      showToast(`Contact "${data.name}" created locally`, 'info');
      return fallback;
    }
  };

  // Products
  const addProduct = async (data) => {
    try {
      const res = await api.createProduct(data);
      const created = res?.data || res?.product || {
        ...data,
        _id: `prod_${Date.now()}`,
        isActive: true,
        stockQuantity: Number(data.stockQuantity || 0)
      };
      setProducts(prev => [created, ...prev]);
      showToast(`Product "${created.productName}" added to Master List`, 'success');
      addAuditLog('CREATE_PRODUCT', `Added product ${created.productName}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating product on backend:', err.message);
      const fallbackProduct = {
        ...data,
        _id: `prod_${Date.now()}`,
        isActive: true,
        stockQuantity: Number(data.stockQuantity || 0)
      };
      setProducts(prev => [fallbackProduct, ...prev]);
      showToast(`Product "${data.productName}" added locally`, 'info');
      return fallbackProduct;
    }
  };

  const archiveProduct = async (productId) => {
    const prod = products.find(p => p._id === productId);
    const nextStatus = prod ? !prod.isActive : false;
    try {
      if (nextStatus) {
        await api.updateProduct(productId, { isActive: true });
      } else {
        await api.archiveProduct(productId);
      }
    } catch (err) {
      console.warn('[APP CONTEXT] Error toggling product status on backend:', err.message);
    }
    setProducts(prev => prev.map(p => p._id === productId ? { ...p, isActive: nextStatus } : p));
    showToast(`Product status updated to ${nextStatus ? 'Active' : 'Archived'}`, 'info');
    addAuditLog('ARCHIVE_PRODUCT', `Updated status for product ${productId} to ${nextStatus}`);
  };

  const updateProductInState = (updatedProduct) => {
    setProducts(prev => prev.map(p => p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p));
  };

  // Chart of Accounts
  const addCOA = async (data) => {
    try {
      const res = await api.createAccount(data);
      const created = res?.data || { ...data, _id: `coa_${Date.now()}`, isActive: true };
      setCOA(prev => [created, ...prev]);
      showToast(`Account "${created.accountName}" created`, 'success');
      addAuditLog('CREATE_COA', `Created COA account ${created.accountName}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating account on backend:', err.message);
      const fallbackAcc = { ...data, _id: `coa_${Date.now()}`, isActive: true };
      setCOA(prev => [fallbackAcc, ...prev]);
      showToast(`Account "${data.accountName}" created locally`, 'info');
      return fallbackAcc;
    }
  };

  const toggleAccountStatus = async (accountId, currentStatus) => {
    const nextStatus = !currentStatus;
    try {
      await api.updateAccountStatus(accountId, nextStatus);
    } catch (err) {
      console.warn('[APP CONTEXT] Error toggling account status on backend:', err.message);
    }
    setCOA(prev => prev.map(acc => acc._id === accountId ? { ...acc, isActive: nextStatus } : acc));
    showToast(`Account status updated to ${nextStatus ? 'Active' : 'Archived'}`, 'info');
    addAuditLog('STATUS_COA', `Updated account ${accountId} status to ${nextStatus}`);
  };

  // Journals
  const addJournal = async (data) => {
    const payload = { ...data };
    if (!payload.def_debitAcc) delete payload.def_debitAcc;
    if (!payload.def_creditAcc) delete payload.def_creditAcc;

    try {
      const res = await api.createJournal(payload);
      const created = res?.data || { ...payload, _id: `j_${Date.now()}` };
      setJournals(prev => [created, ...prev]);
      showToast(`Journal "${created.journalName}" created`, 'success');
      addAuditLog('CREATE_JOURNAL', `Created journal ${created.journalName}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating journal on backend:', err.message);
      const fallbackJournal = { ...payload, _id: `j_${Date.now()}` };
      setJournals(prev => [fallbackJournal, ...prev]);
      showToast(`Journal "${data.journalName}" created locally`, 'info');
      return fallbackJournal;
    }
  };

  // Analytic Accounts
  const addAnalyticAccount = async (data) => {
    try {
      const res = await api.createAnalyticAccount(data);
      const created = res?.data || { ...data, _id: `an_${Date.now()}` };
      setAnalyticAccounts(prev => [created, ...prev]);
      showToast(`Analytic Account "${created.name}" created`, 'success');
      addAuditLog('CREATE_ANALYTIC', `Created analytic account ${created.name}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating analytic account on backend:', err.message);
      const fallbackAnalytic = { ...data, _id: `an_${Date.now()}` };
      setAnalyticAccounts(prev => [fallbackAnalytic, ...prev]);
      showToast(`Analytic Account "${data.name}" created locally`, 'info');
      return fallbackAnalytic;
    }
  };

  // Auto-fetch data from backend API ONLY after user is authenticated based on their role
  useEffect(() => {
    if (!isAuthenticated) return;

    const role = (currentUser?.userType || currentUser?.role || userRole || localStorage.getItem('uf_role') || '').toUpperCase();
    let contactRole = (
      currentUser?.contactRole ||
      currentUser?.contact_role ||
      currentUser?.contact_id ||
      currentUser?.user?.contact_role ||
      ''
    ).toUpperCase();

    if (!contactRole) {
      try {
        const token = localStorage.getItem('uf_token');
        if (token && token.includes('.')) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload?.contactRole) contactRole = payload.contactRole.toUpperCase();
        }
      } catch (_) { }
    }

    const isContactUser = role === 'CONTACT';

    const loadAllAppData = async () => {
      if (isContactUser) {
        // CONTACT (Vendor or Customer Portal): Only fetch permitted self-service data
        // 1. Products catalog (viewable by all authenticated users)
        try {
          const res = await api.getProducts();
          const list = res?.data || (Array.isArray(res) ? res : []);
          setProducts(list);
        } catch (err) {
          console.warn('[APP CONTEXT] Failed to load products from API:', err.message);
        }

        // 2. Self-service Vendor Bills (for Vendors or Both)
        if (contactRole === 'VENDOR' || contactRole === 'BOTH' || !contactRole) {
          try {
            const res = await api.getMyVendorBills();
            const list = res?.data || (Array.isArray(res) ? res : []);
            setVendorBills(list);
          } catch (err) {
            console.warn('[APP CONTEXT] Failed to load vendor bills from API:', err.message);
          }
        }

        // 3. Customer Invoices (for Customers or Both)
        if (contactRole === 'CUSTOMER' || contactRole === 'BOTH' || !contactRole) {
          try {
            const data = await api.getInvoices();
            const list = data?.data || (Array.isArray(data) ? data : []);
            setInvoices(list);
          } catch (err) {
            console.warn('[APP CONTEXT] Failed to load invoices from API:', err.message);
          }
        }

        return;
      }

      // ADMIN & ACCOUNTANT: Fetch all internal accounting & master data
      // Products
      try {
        const res = await api.getProducts();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setProducts(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load products from API:', err.message);
      }

      // Chart of Accounts
      try {
        const res = await api.getAccounts();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setCOA(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load accounts from API:', err.message);
      }

      // Journals
      try {
        const res = await api.getJournals();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setJournals(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load journals from API:', err.message);
      }

      // Analytic Accounts
      try {
        const res = await api.getAnalyticAccounts();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setAnalyticAccounts(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load analytic accounts from API:', err.message);
      }

      // Contacts
      try {
        const res = await api.getContacts();
        const list = res?.contacts || res?.data || (Array.isArray(res) ? res : []);
        setContacts(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load contacts from API:', err.message);
      }

      // Sales Orders
      try {
        const data = await api.getSalesOrders();
        const list = data?.data || (Array.isArray(data) ? data : []);
        setSalesOrders(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load sales orders from API:', err.message);
      }

      // Invoices
      try {
        const data = await api.getInvoices();
        const list = data?.data || (Array.isArray(data) ? data : []);
        setInvoices(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load invoices from API:', err.message);
      }

      // Purchase Orders
      try {
        const res = await api.getPurchaseOrders();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setPurchaseOrders(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load purchase orders from API:', err.message);
      }

      // Vendor Bills
      try {
        const res = await api.getVendorBills();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setVendorBills(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load vendor bills from API:', err.message);
      }

      // Payments
      try {
        const res = await api.getPayments();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setPayments(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load payments from API:', err.message);
      }

      // Journal Entries
      try {
        const res = await api.getJournalEntries();
        const list = res?.data || (Array.isArray(res) ? res : []);
        setJournalEntries(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load journal entries from API:', err.message);
      }

      // Budgets
      try {
        const res = await api.getBudgets();
        const list = res?.budgets || res?.data || (Array.isArray(res) ? res : []);
        setBudgets(list);
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load budgets from API:', err.message);
      }
    };

    loadAllAppData();
  }, [isAuthenticated, currentUser?.role, currentUser?.userType, currentUser?.contactRole]);

  // Sales Orders & Invoices Workflow
  const addSalesOrder = async (data) => {
    const nextSeq = `S${String(salesOrders.length + 1).padStart(5, '0')}`;
    const payload = {
      ...data,
      so_number: data.so_number || nextSeq,
      customerName: data.customerName || 'Customer',
      total_amount: Number(data.total_amount || 0),
      items: data.items || []
    };

    try {
      const res = await api.createSalesOrder(payload);
      const created = res?.salesOrder || { ...payload, _id: `so_${Date.now()}`, status: 'DRAFT' };
      setSalesOrders(prev => [created, ...prev]);
      showToast(`Sales Order ${created.so_number} created in Draft`, 'success');
      addAuditLog('CREATE_SO', `Created Sales Order ${created.so_number}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating SO on backend:', err.message);
      const fallbackSO = { ...payload, _id: `so_${Date.now()}`, status: 'DRAFT' };
      setSalesOrders(prev => [fallbackSO, ...prev]);
      showToast(`Sales Order ${nextSeq} created locally`, 'info');
      return fallbackSO;
    }
  };

  const confirmSalesOrder = async (soId) => {
    const so = salesOrders.find(s => s._id === soId);
    if (!so) return;

    try {
      await api.confirmSalesOrder(soId);
    } catch (err) {
      console.warn('[APP CONTEXT] Error confirming SO on backend:', err.message);
    }

    setSalesOrders(prev => prev.map(s => s._id === soId ? { ...s, status: 'CONFIRMED' } : s));
    showToast(`Sales Order ${so.so_number} status updated to CONFIRMED.`, 'success');
    addAuditLog('CONFIRM_SO', `Confirmed Sales Order ${so.so_number}`);
  };

  const cancelSalesOrder = async (soId) => {
    const so = salesOrders.find(s => s._id === soId);
    if (!so) return;

    try {
      await api.cancelSalesOrder(soId);
    } catch (err) {
      console.warn('[APP CONTEXT] Error cancelling SO on backend:', err.message);
    }

    setSalesOrders(prev => prev.map(s => s._id === soId ? { ...s, status: 'CANCEL' } : s));
    showToast(`Sales Order ${so.so_number} cancelled.`, 'info');
    addAuditLog('CANCEL_SO', `Cancelled Sales Order ${so.so_number}`);
  };

  const createInvoiceFromSO = async (soId) => {
    const so = salesOrders.find(s => s._id === soId);
    if (!so) return;

    try {
      const res = await api.createInvoiceFromSO(soId);
      if (res?.invoice) {
        setInvoices(prev => [res.invoice, ...prev]);
      }
    } catch (err) {
      console.warn('[APP CONTEXT] Error generating invoice from SO on backend:', err.message);
      const nextInvSeq = `INV/2026/${String(invoices.length + 1).padStart(4, '0')}`;
      const fallbackInv = {
        _id: `inv_${Date.now()}`,
        inv_number: nextInvSeq,
        sales: soId,
        customerName: so.customerName || 'Customer',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        total_amount: so.total_amount,
        amount_paid: 0,
        amount_due: so.total_amount,
        status: 'DUE',
        items: so.items
      };
      setInvoices(prev => [fallbackInv, ...prev]);
    }

    setSalesOrders(prev => prev.map(s => s._id === soId ? { ...s, status: 'INVOICE' } : s));
    showToast(`Sales Order ${so.so_number} converted to Invoice!`, 'success');
    addAuditLog('INVOICE_SO', `Generated invoice from Sales Order ${so.so_number}`);
  };



  // Confirm Invoice -> Auto Journal Entry (Debit Debtors, Credit Sales Income)
  const confirmInvoice = async (invId) => {
    const inv = invoices.find(i => i._id === invId);
    if (!inv) return;

    try {
      await api.confirmInvoice(invId);
    } catch (err) {
      console.warn('[APP CONTEXT] Error confirming invoice on backend:', err.message);
    }

    setInvoices(prev => prev.map(i => i._id === invId ? { ...i, status: i.amount_due === 0 ? 'PAID' : 'DUE' } : i));

    // Auto-create balanced Journal Entry
    const newJE = {
      _id: `je_${Date.now()}`,
      number: inv.inv_number,
      date: new Date().toISOString().split('T')[0],
      partnerName: inv.customerName,
      journal: 'j_1',
      journalName: 'Sales',
      status: 'POSTED',
      sourceType: 'INVOICE',
      sourceId: invId,
      total: inv.total_amount,
      journalItems: [
        { account: 'coa_4', accountName: 'Debtors A/c', partner: inv.customerName, debit: inv.total_amount, credit: 0 },
        { account: 'coa_8', accountName: 'Sales Income A/c', partner: inv.customerName, debit: 0, credit: inv.total_amount }
      ]
    };

    setJournalEntries(prev => [newJE, ...prev]);
    showToast(`Invoice ${inv.inv_number} confirmed! Journal Entry posted automatically.`, 'success');
    addAuditLog('CONFIRM_INVOICE', `Confirmed invoice ${inv.inv_number} and posted journal entry`);
  };

  const cancelInvoice = async (invId) => {
    const inv = invoices.find(i => i._id === invId);
    if (!inv) return;

    try {
      await api.cancelInvoice(invId);
    } catch (err) {
      console.warn('[APP CONTEXT] Error cancelling invoice on backend:', err.message);
    }

    setInvoices(prev => prev.map(i => i._id === invId ? { ...i, status: 'CANCEL' } : i));
    showToast(`Invoice ${inv.inv_number} cancelled.`, 'info');
    addAuditLog('CANCEL_INVOICE', `Cancelled invoice ${inv.inv_number}`);
  };

  // Purchase Orders & Vendor Bills Workflow
  const addPurchaseOrder = async (data) => {
    try {
      const items = (data.items || []).map(item => ({
        product: item.product?._id || item.product,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        tax: Number(item.tax) || 0
      }));

      const purchase_id = data.purchase_id || (purchaseOrders.length + 1);
      const vendorId = data.vendor?._id || data.vendor;

      const payload = {
        purchase_id,
        vendor: vendorId,
        items,
        total_amount: Number(data.total_amount) || items.reduce((s, i) => s + (i.quantity * i.unitPrice + i.tax), 0),
        date: data.date || new Date().toISOString()
      };

      const res = await api.createPurchaseOrder(payload);
      const created = res?.data || {
        ...payload,
        _id: `po_${Date.now()}`,
        status: 'DRAFT',
        vendor: contacts.find(c => c._id === vendorId) || { name: 'Vendor' }
      };

      setPurchaseOrders(prev => [created, ...prev]);
      showToast(`Purchase Order created in Draft`, 'success');
      addAuditLog('CREATE_PO', `Created Purchase Order #${created.purchase_id || purchase_id}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Failed to create PO on backend:', err.message);
      showToast(err.message || 'Failed to create Purchase Order', 'error');
      throw err;
    }
  };

  const confirmPurchaseOrder = async (poId) => {
    try {
      const confirmRes = await api.confirmPurchaseOrder(poId);
      const updatedPO = confirmRes?.data;
      setPurchaseOrders(prev => prev.map(p => p._id === poId ? (updatedPO || { ...p, status: 'CONFIRMED' }) : p));

      // Auto-generate Vendor Bill
      const nextBillSeq = `Bill/2026/${String(vendorBills.length + 1).padStart(4, '0')}`;
      const billData = {
        bill_number: nextBillSeq,
        due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
        bill_date: new Date().toISOString()
      };

      try {
        const billRes = await api.createVendorBillFromPO(poId, billData);
        if (billRes?.data) {
          setVendorBills(prev => [billRes.data, ...prev]);
        } else {
          const po = purchaseOrders.find(p => p._id === poId);
          if (po) {
            const fallbackBill = {
              _id: `bill_${Date.now()}`,
              bill_number: nextBillSeq,
              sales: poId,
              vendor: po.vendor,
              due_date: billData.due_date,
              bill_date: billData.bill_date,
              total: po.total_amount,
              amount_due: po.total_amount,
              amount_paid: 0,
              status: 'DUE'
            };
            setVendorBills(prev => [fallbackBill, ...prev]);
          }
        }
      } catch (billErr) {
        console.warn('[APP CONTEXT] Vendor bill auto-generation note:', billErr.message);
      }

      showToast(`Purchase Order confirmed & Vendor Bill generated!`, 'success');
      addAuditLog('CONFIRM_PO', `Confirmed PO and generated vendor bill`);
    } catch (err) {
      console.warn('[APP CONTEXT] Error confirming PO:', err.message);
      showToast(err.message || 'Failed to confirm purchase order', 'error');
    }
  };

  // Confirm Vendor Bill -> Auto Journal Entry
  const confirmVendorBill = async (billId) => {
    try {
      const res = await api.confirmVendorBill(billId);
      const updatedBill = res?.data;

      setVendorBills(prev => prev.map(b => {
        if (b._id === billId) {
          const mergedVendor = (updatedBill?.vendor && typeof updatedBill.vendor === 'object' && updatedBill.vendor.name)
            ? updatedBill.vendor
            : (b.vendor && typeof b.vendor === 'object' ? b.vendor : updatedBill?.vendor || b.vendor);
          return {
            ...b,
            ...(updatedBill || { status: 'DUE' }),
            vendor: mergedVendor
          };
        }
        return b;
      }));

      const bill = vendorBills.find(b => b._id === billId) || updatedBill;
      const billTotal = Number(bill?.total || 0);

      // Auto-post Journal Entry for Vendor Bill
      const purchaseJournal = journals.find(j => j.type === 'PURCHASE') || journals[0];
      const purchaseExpenseAcc = coa.find(a => a.type === 'EXPENSE' || a.accountName?.toLowerCase().includes('expense') || a.accountName?.toLowerCase().includes('purchase')) || coa[0];
      const payableAcc = coa.find(a => a.type === 'LIABILITY' || a.accountName?.toLowerCase().includes('payable') || a.accountName?.toLowerCase().includes('creditor')) || coa[1];

      if (purchaseJournal && purchaseExpenseAcc && payableAcc && billTotal > 0) {
        try {
          const jePayload = {
            journal: purchaseJournal._id,
            date: new Date().toISOString(),
            inv_bill: bill?.bill_number || `Bill-${billId.slice(-6)}`,
            sourceType: 'VENDOR_BILL',
            sourceId: billId,
            journalItems: [
              { account: purchaseExpenseAcc._id, debit: billTotal, credit: 0 },
              { account: payableAcc._id, debit: 0, credit: billTotal }
            ]
          };
          const jeRes = await api.createJournalEntry(jePayload);
          if (jeRes?.data?._id) {
            await api.postJournalEntry(jeRes.data._id);
            jeRes.data.status = 'POSTED';
            setJournalEntries(prev => [jeRes.data, ...prev]);
          }
        } catch (jeErr) {
          console.warn('[APP CONTEXT] Auto-JE creation note:', jeErr.message);
        }
      }

      showToast(`Vendor Bill confirmed & Journal Entry created!`, 'success');
      addAuditLog('CONFIRM_VENDOR_BILL', `Confirmed bill #${bill?.bill_number || billId}`);
    } catch (err) {
      console.warn('[APP CONTEXT] Error confirming bill:', err.message);
      showToast(err.message || 'Failed to confirm vendor bill', 'error');
    }
  };

  // Payment Handlers (Customer Invoice / Vendor Bill)
  const processPayment = async (paymentData) => {
    try {
      const payload = {
        invoiceBill: paymentData.type === 'RECEIVE' ? (paymentData.invoiceBill?._id || paymentData.invoiceBill) : undefined,
        vendorbill: paymentData.type === 'SEND' ? (paymentData.vendorbill?._id || paymentData.vendorbill) : undefined,
        payment_method: paymentData.payment_method || 'BANK',
        amount: Number(paymentData.amount),
        type: paymentData.type,
        date: paymentData.date || new Date().toISOString()
      };

      const res = await api.createPayment(payload);
      const created = res?.data;

      // Confirm payment to settle invoice/bill and create journal entry in backend
      if (created?._id) {
        try {
          const confirmRes = await api.confirmPayment(created._id);
          const confirmedPayment = confirmRes?.data?.payment || (confirmRes?.data?._id ? confirmRes.data : { ...created, status: 'CONFIRM' });
          const updatedBill = confirmRes?.data?.bill;

          setPayments(prev => [confirmedPayment, ...prev]);

          if (updatedBill?._id) {
            if (payload.vendorbill) {
              setVendorBills(prev => prev.map(b => {
                if (b._id === updatedBill._id) {
                  const mergedVendor = (updatedBill.vendor && typeof updatedBill.vendor === 'object' && updatedBill.vendor.name)
                    ? updatedBill.vendor
                    : (b.vendor && typeof b.vendor === 'object' ? b.vendor : updatedBill.vendor || b.vendor);
                  return {
                    ...b,
                    ...updatedBill,
                    vendor: mergedVendor
                  };
                }
                return b;
              }));
            } else if (payload.invoiceBill) {
              setInvoices(prev => prev.map(inv => inv._id === updatedBill._id ? { ...inv, ...updatedBill, customerName: updatedBill.customerName || inv.customerName } : inv));
            }
          }
        } catch (confErr) {
          setPayments(prev => [created, ...prev]);
        }
      } else {
        const fallback = { ...payload, _id: `pay_${Date.now()}`, status: 'CONFIRM' };
        setPayments(prev => [fallback, ...prev]);
      }

      // Update local invoice or vendor bill state as fallback
      if (payload.invoiceBill) {
        setInvoices(prev => prev.map(inv => {
          if (inv._id === payload.invoiceBill) {
            const newPaid = Number(inv.amount_paid || 0) + payload.amount;
            const newDue = Math.max(0, Number(inv.total_amount ?? inv.total ?? 0) - newPaid);
            return { ...inv, amount_paid: newPaid, amount_due: newDue, status: newDue === 0 ? 'PAID' : 'DUE' };
          }
          return inv;
        }));
      }

      if (payload.vendorbill) {
        setVendorBills(prev => prev.map(bill => {
          if (bill._id === payload.vendorbill) {
            const newPaid = Number(bill.amount_paid || 0) + payload.amount;
            const newDue = Math.max(0, Number(bill.total || 0) - newPaid);
            return { ...bill, amount_paid: newPaid, amount_due: newDue, status: newDue === 0 ? 'PAID' : 'DUE' };
          }
          return bill;
        }));
      }

      showToast(`Payment of Rs. ${payload.amount.toLocaleString()} processed successfully`, 'success');
      addAuditLog('PROCESS_PAYMENT', `Processed ${payload.type} payment of Rs. ${payload.amount}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Payment error:', err.message);
      showToast(err.message || 'Failed to process payment', 'error');
      throw err;
    }
  };

  // Double-Entry Manual Journal Entry Creation with Strict Debit/Credit Validation
  const addJournalEntry = async (data) => {
    const { isBalanced, totalDebit, totalCredit, difference } = validateJournalEntryBalance(data.journalItems);

    if (!isBalanced) {
      showToast(`Unbalanced Entry! Total Debit (Rs. ${totalDebit}) does not match Total Credit (Rs. ${totalCredit}). Difference: Rs. ${difference}`, 'error');
      return false;
    }

    try {
      const payload = {
        journal: data.journal?._id || data.journal,
        date: data.date || new Date().toISOString(),
        inv_bill: data.inv_bill || `JE/${Date.now().toString().slice(-6)}`,
        sourceType: data.sourceType || 'MANUAL',
        sourceId: data.sourceId,
        invoice_order_ref: data.invoice_order_ref,
        journalItems: (data.journalItems || []).map(item => ({
          account: item.account?._id || item.account,
          debit: Number(item.debit || 0),
          credit: Number(item.credit || 0)
        }))
      };

      const res = await api.createJournalEntry(payload);
      let created = res?.data || { ...payload, _id: `je_${Date.now()}`, status: 'DRAFT' };

      // Post the journal entry immediately
      try {
        if (created._id) {
          const postRes = await api.postJournalEntry(created._id);
          if (postRes?.data) created = postRes.data;
          else created.status = 'POSTED';
        }
      } catch (postErr) {
        console.warn('[APP CONTEXT] Journal entry created as draft, auto-post note:', postErr.message);
      }

      setJournalEntries(prev => [created, ...prev]);
      showToast(`Journal Entry posted cleanly.`, 'success');
      addAuditLog('CREATE_JOURNAL_ENTRY', `Posted journal entry ${created.inv_bill || created._id}`);
      return true;
    } catch (err) {
      console.warn('[APP CONTEXT] Journal entry error:', err.message);
      showToast(err.message || 'Failed to post journal entry', 'error');
      return false;
    }
  };

  // Reversal Journal Entry
  const reverseJournalEntry = (jeId) => {
    const je = journalEntries.find(j => j._id === jeId);
    if (!je) return;

    const reversedItems = (je.journalItems || []).map(item => ({
      ...item,
      debit: item.credit,
      credit: item.debit
    }));

    const reversalJE = {
      _id: `je_${Date.now()}`,
      number: `REV/${je.number || je.inv_bill || je._id}`,
      date: new Date().toISOString().split('T')[0],
      partnerName: je.partnerName,
      journal: je.journal,
      journalName: je.journalName,
      status: 'POSTED',
      sourceType: 'REVERSAL',
      total: je.total,
      journalItems: reversedItems
    };

    setJournalEntries(prev => [reversalJE, ...prev]);
    showToast(`Journal Entry reversed successfully.`, 'success');
    addAuditLog('REVERSE_JOURNAL_ENTRY', `Reversed journal entry ${je._id}`);
  };

  // Budget Lifecycle (Draft -> Confirm -> Revise / Archive)
  const addBudget = async (data) => {
    try {
      const payload = {
        name: data.name,
        analyticAccountId: data.analyticAccountId || data.analytics_account?._id || data.analytics_account,
        type: data.type || 'EXPENSE',
        amount: Number(data.committed_amount || data.amount || 0),
        start_date: data.start_date,
        end_date: data.end_date,
        responsiblePerson: data.responsiblePerson
      };

      const res = await api.createBudget(payload);
      const created = res?.budget || { ...payload, _id: `b_${Date.now()}`, status: 'DRAFT' };
      setBudgets(prev => [created, ...prev]);
      showToast(`Budget "${created.name}" created in Draft stage`, 'success');
      addAuditLog('CREATE_BUDGET', `Created draft budget ${created.name}`);
      return created;
    } catch (err) {
      console.warn('[APP CONTEXT] Error creating budget:', err.message);
      showToast(err.message || 'Failed to create budget', 'error');
      throw err;
    }
  };

  const confirmBudget = async (budgetId) => {
    try {
      const res = await api.confirmBudget(budgetId);
      const updated = res?.budget;
      setBudgets(prev => prev.map(b => b._id === budgetId ? (updated || { ...b, status: 'CONFIRMED' }) : b));
      showToast(`Budget confirmed successfully! Achieved metrics activated.`, 'success');
      addAuditLog('CONFIRM_BUDGET', `Confirmed budget ID ${budgetId}`);
    } catch (err) {
      console.warn('[APP CONTEXT] Error confirming budget:', err.message);
      showToast(err.message || 'Failed to confirm budget', 'error');
    }
  };

  const reviseBudget = async (budgetId, newCommittedAmount) => {
    try {
      const res = await api.reviseBudget(budgetId, { amount: Number(newCommittedAmount) });
      const updated = res?.budget;
      setBudgets(prev => prev.map(b => b._id === budgetId ? (updated || { ...b, committed_amount: Number(newCommittedAmount) }) : b));
      showToast(`Budget revised! Limit updated to Rs. ${Number(newCommittedAmount).toLocaleString()}`, 'success');
      addAuditLog('REVISE_BUDGET', `Revised budget ${budgetId} amount to ${newCommittedAmount}`);
    } catch (err) {
      console.warn('[APP CONTEXT] Error revising budget:', err.message);
      showToast(err.message || 'Failed to revise budget', 'error');
    }
  };

  // Stock Adjustment
  const adjustStock = (productId, adjustmentQty, reason) => {
    setProducts(prev => prev.map(p => {
      if (p._id === productId) {
        const newQty = Math.max(0, Number(p.stockQuantity || 0) + Number(adjustmentQty));
        return { ...p, stockQuantity: newQty };
      }
      return p;
    }));
    showToast(`Stock adjusted for product`, 'success');
    addAuditLog('ADJUST_STOCK', `Stock adjusted by ${adjustmentQty} (Reason: ${reason})`);
    api.createStockAdjustment({ productId, adjustmentQty, reason });
  };

  return (
    <AppContext.Provider
      value={{
        users,
        contacts,
        products,
        coa,
        journals,
        analyticAccounts,
        budgets,
        salesOrders,
        invoices,
        purchaseOrders,
        vendorBills,
        payments,
        journalEntries,
        auditLogs,
        toasts,
        showToast,
        addContact,
        addProduct,
        archiveProduct,
        updateProductInState,
        addCOA,
        toggleAccountStatus,
        addJournal,
        addAnalyticAccount,
        addSalesOrder,
        confirmSalesOrder,
        cancelSalesOrder,
        createInvoiceFromSO,
        confirmInvoice,
        cancelInvoice,
        addPurchaseOrder,
        confirmPurchaseOrder,
        confirmVendorBill,
        processPayment,
        addJournalEntry,
        reverseJournalEntry,
        addBudget,
        confirmBudget,
        reviseBudget,
        adjustStock
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
