import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialUsers,
  initialContacts,
  initialProducts,
  initialCOA,
  initialJournals,
  initialAnalyticsAccounts,
  initialBudgets,
  initialSalesOrders,
  initialInvoices,
  initialPurchaseOrders,
  initialVendorBills,
  initialPayments,
  initialJournalEntries,
  initialAuditLogs
} from '../services/mockData';
import { validateJournalEntryBalance, computeBudgetMetrics } from '../utils/accountingMath';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [users, setUsers] = useState(initialUsers);
  const [contacts, setContacts] = useState(initialContacts);
  const [products, setProducts] = useState(initialProducts);
  const [coa, setCOA] = useState(initialCOA);
  const [journals, setJournals] = useState(initialJournals);
  const [analyticAccounts, setAnalyticAccounts] = useState(initialAnalyticsAccounts);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [salesOrders, setSalesOrders] = useState(initialSalesOrders);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [vendorBills, setVendorBills] = useState(initialVendorBills);
  const [payments, setPayments] = useState(initialPayments);
  const [journalEntries, setJournalEntries] = useState(initialJournalEntries);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
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
  const addContact = (data) => {
    const newContact = { ...data, _id: `contact_${Date.now()}` };
    setContacts(prev => [newContact, ...prev]);
    showToast(`Contact "${data.name}" created successfully`, 'success');
    addAuditLog('CREATE_CONTACT', `Added contact ${data.name}`);
    api.createContact(data);
  };

  // Products
  const addProduct = (data) => {
    const newProduct = {
      ...data,
      _id: `prod_${Date.now()}`,
      isActive: true,
      stockQuantity: Number(data.stockQuantity || 0)
    };
    setProducts(prev => [newProduct, ...prev]);
    showToast(`Product "${data.productName}" added to Master List`, 'success');
    addAuditLog('CREATE_PRODUCT', `Added product ${data.productName}`);
    api.createProduct(data);
  };

  // Chart of Accounts
  const addCOA = (data) => {
    const newAcc = { ...data, _id: `coa_${Date.now()}`, isActive: true };
    setCOA(prev => [...prev, newAcc]);
    showToast(`Account "${data.accountName}" created`, 'success');
    addAuditLog('CREATE_COA', `Created COA account ${data.accountName}`);
    api.createAccount(data);
  };

  // Journals
  const addJournal = (data) => {
    const newJournal = { ...data, _id: `j_${Date.now()}` };
    setJournals(prev => [...prev, newJournal]);
    showToast(`Journal "${data.journalName}" created`, 'success');
    addAuditLog('CREATE_JOURNAL', `Created journal ${data.journalName}`);
    api.createJournal(data);
  };

  // Analytic Accounts
  const addAnalyticAccount = (data) => {
    const newAnalytic = { ...data, _id: `an_${Date.now()}` };
    setAnalyticAccounts(prev => [...prev, newAnalytic]);
    showToast(`Analytic Account "${data.name}" created`, 'success');
    addAuditLog('CREATE_ANALYTIC', `Created analytic account ${data.name}`);
    api.createAnalyticAccount(data);
  };

  // Auto-fetch Sales Orders from backend API on mount
  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        const data = await api.getSalesOrders();
        if (Array.isArray(data) && data.length > 0) {
          setSalesOrders(data);
        }
      } catch (err) {
        console.warn('[APP CONTEXT] Failed to load sales orders from API:', err.message);
      }
    };
    fetchSalesOrders();
  }, []);

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
  const confirmInvoice = (invId) => {
    const inv = invoices.find(i => i._id === invId);
    if (!inv) return;

    setInvoices(prev => prev.map(i => i._id === invId ? { ...i, status: 'DUE' } : i));

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
    api.confirmInvoice(invId);
  };

  // Purchase Orders & Vendor Bills Workflow
  const addPurchaseOrder = (data) => {
    const nextSeq = `P${String(purchaseOrders.length + 1).padStart(5, '0')}`;
    const newPO = {
      ...data,
      _id: `po_${Date.now()}`,
      po_number: nextSeq,
      purchase_id: purchaseOrders.length + 1,
      status: 'DRAFT',
      date: new Date().toISOString().split('T')[0]
    };
    setPurchaseOrders(prev => [newPO, ...prev]);
    showToast(`Purchase Order ${nextSeq} created in Draft`, 'success');
    addAuditLog('CREATE_PO', `Created Purchase Order ${nextSeq}`);
    api.createPurchaseOrder(newPO);
    return newPO;
  };

  const confirmPurchaseOrder = (poId) => {
    const po = purchaseOrders.find(p => p._id === poId);
    if (!po) return;

    setPurchaseOrders(prev => prev.map(p => p._id === poId ? { ...p, status: 'CONFIRMED' } : p));

    // Auto-generate Vendor Bill
    const nextBillSeq = `Bill/2026/${String(vendorBills.length + 1).padStart(4, '0')}`;
    const newBill = {
      _id: `bill_${Date.now()}`,
      bill_number: nextBillSeq,
      bill_reference: `REF-${po.po_number}`,
      sales: poId,
      vendor: po.vendor,
      vendorName: po.vendorName || 'Vendor',
      bill_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      total: po.total_amount,
      amount_paid: 0,
      amount_due: po.total_amount,
      status: 'DUE',
      items: po.items
    };

    setVendorBills(prev => [newBill, ...prev]);
    showToast(`Purchase Order ${po.po_number} confirmed! Vendor Bill ${nextBillSeq} created.`, 'success');
    addAuditLog('CONFIRM_PO', `Confirmed ${po.po_number} & generated vendor bill ${nextBillSeq}`);
    api.confirmPurchaseOrder(poId);
    api.createVendorBillFromPO(poId);
  };

  // Confirm Vendor Bill -> Auto Journal Entry (Debit Purchase Expense, Credit Creditors)
  const confirmVendorBill = (billId) => {
    const bill = vendorBills.find(b => b._id === billId);
    if (!bill) return;

    setVendorBills(prev => prev.map(b => b._id === billId ? { ...b, status: 'DUE' } : b));

    const newJE = {
      _id: `je_${Date.now()}`,
      number: bill.bill_number,
      date: new Date().toISOString().split('T')[0],
      partnerName: bill.vendorName,
      journal: 'j_2',
      journalName: 'Purchases',
      status: 'POSTED',
      sourceType: 'VENDOR_BILL',
      sourceId: billId,
      total: bill.total,
      journalItems: [
        { account: 'coa_9', accountName: 'Purchase Expense A/c', partner: bill.vendorName, debit: bill.total, credit: 0 },
        { account: 'coa_6', accountName: 'Creditors A/c', partner: bill.vendorName, debit: 0, credit: bill.total }
      ]
    };

    setJournalEntries(prev => [newJE, ...prev]);
    showToast(`Vendor Bill ${bill.bill_number} confirmed! Journal Entry posted automatically.`, 'success');
    addAuditLog('CONFIRM_VENDOR_BILL', `Confirmed bill ${bill.bill_number} & posted journal entry`);
    api.confirmVendorBill(billId);
  };

  // Payment Handlers (Customer Invoice / Vendor Bill)
  const processPayment = (paymentData) => {
    const newPay = {
      ...paymentData,
      _id: `pay_${Date.now()}`,
      status: 'CONFIRM',
      date: paymentData.date || new Date().toISOString().split('T')[0]
    };

    setPayments(prev => [newPay, ...prev]);

    if (paymentData.invoiceBill) {
      setInvoices(prev => prev.map(inv => {
        if (inv._id === paymentData.invoiceBill) {
          const newPaid = Number(inv.amount_paid || 0) + Number(paymentData.amount);
          const newDue = Math.max(0, Number(inv.total_amount) - newPaid);
          const newStatus = newDue === 0 ? 'PAID' : 'DUE';
          return { ...inv, amount_paid: newPaid, amount_due: newDue, status: newStatus };
        }
        return inv;
      }));
    }

    if (paymentData.vendorbill) {
      setVendorBills(prev => prev.map(bill => {
        if (bill._id === paymentData.vendorbill) {
          const newPaid = Number(bill.amount_paid || 0) + Number(paymentData.amount);
          const newDue = Math.max(0, Number(bill.total) - newPaid);
          const newStatus = newDue === 0 ? 'PAID' : 'DUE';
          return { ...bill, amount_paid: newPaid, amount_due: newDue, status: newStatus };
        }
        return bill;
      }));
    }

    showToast(`Payment of Rs. ${Number(paymentData.amount).toLocaleString()} processed successfully`, 'success');
    addAuditLog('PROCESS_PAYMENT', `Processed ${paymentData.type} payment of Rs. ${paymentData.amount}`);
    api.createPayment(newPay);
  };

  // Double-Entry Manual Journal Entry Creation with Strict Debit/Credit Validation
  const addJournalEntry = (data) => {
    const { isBalanced, totalDebit, totalCredit, difference } = validateJournalEntryBalance(data.journalItems);

    if (!isBalanced) {
      showToast(`Unbalanced Entry! Total Debit (Rs. ${totalDebit}) does not match Total Credit (Rs. ${totalCredit}). Difference: Rs. ${difference}`, 'error');
      return false;
    }

    const newJE = {
      ...data,
      _id: `je_${Date.now()}`,
      number: data.number || `JE/2026/${String(journalEntries.length + 1).padStart(4, '0')}`,
      status: 'POSTED',
      total: totalDebit
    };

    setJournalEntries(prev => [newJE, ...prev]);
    showToast(`Journal Entry ${newJE.number} posted cleanly.`, 'success');
    addAuditLog('CREATE_JOURNAL_ENTRY', `Posted manual journal entry ${newJE.number}`);
    api.createJournalEntry(newJE);
    return true;
  };

  // Reversal Journal Entry
  const reverseJournalEntry = (jeId) => {
    const je = journalEntries.find(j => j._id === jeId);
    if (!je) return;

    const reversedItems = je.journalItems.map(item => ({
      ...item,
      debit: item.credit,
      credit: item.debit
    }));

    const reversalJE = {
      _id: `je_${Date.now()}`,
      number: `REV/${je.number}`,
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
    showToast(`Journal Entry ${je.number} reversed successfully.`, 'success');
    addAuditLog('REVERSE_JOURNAL_ENTRY', `Reversed journal entry ${je.number}`);
    api.reverseJournalEntry(jeId);
  };

  // Budget Lifecycle (Draft -> Confirm -> Revise / Archive)
  const addBudget = (data) => {
    const newBudget = {
      ...data,
      _id: `budget_${Date.now()}`,
      status: 'DRAFT',
      revisionOf: null,
      revisedWith: null
    };
    setBudgets(prev => [newBudget, ...prev]);
    showToast(`Budget "${data.name}" created in Draft stage`, 'success');
    addAuditLog('CREATE_BUDGET', `Created draft budget ${data.name}`);
    api.createBudget(newBudget);
  };

  const confirmBudget = (budgetId) => {
    setBudgets(prev => prev.map(b => b._id === budgetId ? { ...b, status: 'CONFIRMED' } : b));
    showToast(`Budget confirmed successfully! Achieved metrics activated.`, 'success');
    addAuditLog('CONFIRM_BUDGET', `Confirmed budget ID ${budgetId}`);
    api.confirmBudget(budgetId);
  };

  // Revise Budget SVG Specification:
  // "On Clicking Revise - New Budget will appear and Old one will move to Revised state. Link will be visible on Main Budget and on click it will lead to new revised Budget and the revised will have link to original."
  const reviseBudget = (budgetId, newCommittedAmount) => {
    const oldBudget = budgets.find(b => b._id === budgetId);
    if (!oldBudget) return;

    const newBudgetId = `budget_${Date.now()}`;
    const newBudgetName = oldBudget.name.includes('Revised') ? oldBudget.name : `${oldBudget.name} Revised`;

    const newRevisedBudget = {
      ...oldBudget,
      _id: newBudgetId,
      name: newBudgetName,
      committed_amount: Number(newCommittedAmount),
      status: 'CONFIRMED',
      revisionOf: oldBudget._id,
      revisedWith: null
    };

    // Update old budget to REVISED status and link to new budget
    setBudgets(prev => prev.map(b => {
      if (b._id === budgetId) {
        return { ...b, status: 'REVISED', revisedWith: newBudgetId };
      }
      return b;
    }).concat(newRevisedBudget));

    showToast(`Budget revised! New budget "${newBudgetName}" active with committed limit Rs. ${Number(newCommittedAmount).toLocaleString()}`, 'success');
    addAuditLog('REVISE_BUDGET', `Revised budget ${oldBudget.name} to ${newBudgetName}`);
    api.reviseBudget(budgetId, { newCommittedAmount });
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
        addCOA,
        addJournal,
        addAnalyticAccount,
        addSalesOrder,
        confirmSalesOrder,
        cancelSalesOrder,
        createInvoiceFromSO,
        confirmInvoice,
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
