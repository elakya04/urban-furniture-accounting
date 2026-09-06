import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { OrderLineItemsTable } from '../../components/forms/OrderLineItemsTable';
import { Plus, ShoppingCart, CheckCircle, FileText, ArrowRight, XCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const SalesOrdersPage = () => {
  const {
    salesOrders = [],
    contacts = [],
    products = [],
    coa = [],
    analyticAccounts = [],
    addSalesOrder,
    confirmSalesOrder,
    cancelSalesOrder,
    createInvoiceFromSO,
    fetchSalesOrders
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSO, setSelectedSO] = useState(null);

  // Auto-fetch sales orders on mount
  useEffect(() => {
    if (typeof fetchSalesOrders === 'function') {
      fetchSalesOrders();
    }
  }, []);

  // Filter strictly for Customer contacts (User.role === 'CONTACT' && User.contact_role === 'CUSTOMER' / 'BOTH')
  const customerContacts = (contacts || []).filter(c => {
    if (!c) return false;
    if (c.userType === 'ADMIN' || c.userType === 'ACCOUNTANT') return false;
    const role = c.user?.contact_role || c.contactRole;
    if (role === 'CUSTOMER' || role === 'BOTH') return true;
    if (c.userType === 'CUSTOMER' || c.userType === 'BOTH') return true;
    if (c.loginId?.startsWith('cus_')) return true;
    if (/apex|luxury|living|customer/i.test(c.name)) return true;
    return false;
  });

  const [customer, setCustomer] = useState('');
  useEffect(() => {
    if (!customer && customerContacts.length > 0) {
      setCustomer(customerContacts[0]._id);
    }
  }, [customerContacts, customer]);

  const [items, setItems] = useState([
    {
      product: products[0]?._id || '',
      productName: products[0]?.productName || '',
      account: (coa || []).find(c => c?.accountName?.toLowerCase().includes('sales'))?._id || coa[0]?._id || '',
      budgetAnalytics: analyticAccounts[0]?._id || '',
      quantity: 1,
      unitPrice: products[0]?.salesPrice || 0,
      total: products[0]?.salesPrice || 0
    }
  ]);

  // Synchronize initial line item once products and COA are available
  useEffect(() => {
    if (items.length === 1 && !items[0].product && products.length > 0) {
      const defaultProd = products[0];
      const defaultCOA = (coa || []).find(c => c?.accountName?.toLowerCase().includes('sales'))?._id || coa[0]?._id || '';
      const defaultAnalytic = analyticAccounts[0]?._id || '';
      setItems([{
        product: defaultProd._id,
        productName: defaultProd.productName,
        account: defaultCOA,
        budgetAnalytics: defaultAnalytic,
        quantity: 1,
        unitPrice: defaultProd.salesPrice || 0,
        total: defaultProd.salesPrice || 0
      }]);
    }
  }, [products, coa, analyticAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const custObj = contacts.find(c => c._id === customer);
    const total_amount = items.reduce((sum, i) => sum + Number(i.total || 0), 0);

    await addSalesOrder({
      customer,
      customerName: custObj?.name || 'Customer',
      items,
      total_amount
    });

    setIsAddModalOpen(false);
  };

  const columns = [
    {
      header: 'SO Number',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{row.so_number}</span>
        </div>
      )
    },
    { header: 'Customer Name', accessor: 'customerName' },
    { header: 'SO Date', cell: (row) => formatDate(row.date) },
    { header: 'Total Amount', cell: (row) => formatCurrency(row.total_amount) },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
          {row.status === 'DRAFT' && (
            <button
              onClick={() => confirmSalesOrder(row._id)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Confirm
            </button>
          )}
          {row.status === 'CONFIRMED' && (
            <button
              onClick={() => createInvoiceFromSO(row._id)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" /> Create Invoice
            </button>
          )}
          {row.status === 'INVOICE' && (
            <span className="text-xs text-sky-600 font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Invoiced
            </span>
          )}
          {row.status === 'CANCEL' && (
            <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Cancelled
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Sales Orders (SO)</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Customer Sales Orders & Convert to Invoices</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          Create Sales Order
        </button>
      </div>

      <Table columns={columns} data={salesOrders} onRowClick={(row) => setSelectedSO(row)} />

      {/* Create Sales Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Sales Order" maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Customer Name</label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">-- Select Customer --</option>
                {customerContacts.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.user?.contact_role || c.contactRole || 'CUSTOMER'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">SO Date</label>
              <input
                type="text"
                disabled
                value={new Date().toLocaleDateString('en-GB')}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Order Line Items</label>
            <OrderLineItemsTable items={items} onChange={setItems} isPurchase={false} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Save Sales Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Odoo Style Form View Modal for Sales Order */}
      <Modal isOpen={Boolean(selectedSO)} onClose={() => setSelectedSO(null)} title={`Form View: Sales Order ${selectedSO?.so_number || ''}`} maxWidth="max-w-4xl">
        {selectedSO && (
          <div className="space-y-6">
            {/* Top Stage Bar & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                {selectedSO.status === 'DRAFT' && (
                  <>
                    <button
                      onClick={() => { confirmSalesOrder(selectedSO._id); setSelectedSO(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4" /> Confirm Order
                    </button>
                    <button
                      onClick={() => { cancelSalesOrder(selectedSO._id); setSelectedSO(null); }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold rounded-lg"
                    >
                      <XCircle className="w-4 h-4" /> Cancel
                    </button>
                  </>
                )}
                {selectedSO.status === 'CONFIRMED' && (
                  <button
                    onClick={() => { createInvoiceFromSO(selectedSO._id); setSelectedSO(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <FileText className="w-4 h-4" /> Create Invoice
                  </button>
                )}
                {selectedSO.status === 'INVOICE' && (
                  <span className="px-3 py-1.5 bg-sky-100 text-sky-800 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-sky-200">
                    <FileText className="w-4 h-4 text-sky-600" /> Invoice Created
                  </span>
                )}
              </div>

              {/* Status Progression Bar */}
              <div className="flex items-center gap-1 text-xs font-semibold">
                {['DRAFT', 'CONFIRMED', 'INVOICE'].map((st, idx) => (
                  <React.Fragment key={st}>
                    <span className={`px-2.5 py-1 rounded-md ${selectedSO.status === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200/60 text-slate-500'}`}>
                      {st}
                    </span>
                    {idx < 2 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Document Header Fields */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-semibold">SO Number:</span>
                <div className="text-lg font-bold text-slate-900">{selectedSO.so_number}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Customer Name:</span>
                <div className="text-base font-bold text-slate-800">{selectedSO.customerName}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">SO Date:</span>
                <div className="font-semibold text-slate-700">{formatDate(selectedSO.date)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Total Amount:</span>
                <div className="text-lg font-extrabold text-emerald-700">{formatCurrency(selectedSO.total_amount)}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Order Line Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="p-2.5">Sr. No.</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Chart of Account</th>
                      <th className="p-2.5">Budget Analytics</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSO.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400">{idx + 1}.</td>
                        <td className="p-2.5 font-semibold text-slate-800">{item.productName || item.product}</td>
                        <td className="p-2.5 text-slate-600">{item.accountName || 'Sales Income A/c'}</td>
                        <td className="p-2.5 text-slate-600">{item.budgetAnalyticsName || item.budgetAnalytics || 'Project 1'}</td>
                        <td className="p-2.5 text-center font-medium">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
