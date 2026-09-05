import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { OrderLineItemsTable } from '../../components/forms/OrderLineItemsTable';
import { Plus, Truck, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PurchaseOrdersPage = () => {
  const { purchaseOrders, contacts, products, coa, analyticAccounts, addPurchaseOrder, confirmPurchaseOrder } = useApp();
  const { isContact, isAdmin, isAccountant } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  const [vendor, setVendor] = useState('');
  const [items, setItems] = useState([]);

  // Dynamically synchronize defaults once master data loads
  useEffect(() => {
    if (!vendor && contacts.length > 0) {
      const v = contacts.find(c => c.userType === 'VENDOR' || c.contactRole === 'VENDOR' || c.contactRole === 'BOTH') || contacts[0];
      if (v) setVendor(v._id);
    }
  }, [contacts, vendor]);

  useEffect(() => {
    if (products.length > 0 && items.length === 0) {
      setItems([
        {
          product: products[0]?._id || '',
          productName: products[0]?.productName || '',
          account: coa.find(c => c.accountName?.toLowerCase().includes('purchase'))?._id || coa[0]?._id || '',
          budgetAnalytics: analyticAccounts[0]?._id || '',
          quantity: 2,
          unitPrice: products[0]?.cost || 0,
          total: (products[0]?.cost || 0) * 2
        }
      ]);
    }
  }, [products, coa, analyticAccounts, items.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const vendorObj = contacts.find(c => c._id === vendor);
    const total_amount = items.reduce((sum, i) => sum + Number(i.total || 0), 0);

    addPurchaseOrder({
      vendor,
      vendorName: vendorObj?.name || 'Vendor',
      items,
      total_amount
    });

    setIsAddModalOpen(false);
  };

  const columns = [
    {
      header: 'PO Number',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {row.po_number || (row.purchase_id ? `PO #${row.purchase_id}` : `PO-${row._id?.slice(-5)}`)}
          </span>
        </div>
      )
    },
    {
      header: 'Vendor Name',
      cell: (row) => <span>{row.vendor?.name || row.vendorName || 'Vendor'}</span>
    },
    { header: 'PO Date', cell: (row) => formatDate(row.date) },
    { header: 'Total Amount', cell: (row) => formatCurrency(row.total_amount ?? row.total ?? 0) },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {row.status === 'DRAFT' && !isContact && (
            <button
              onClick={() => confirmPurchaseOrder(row._id)}
              className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Confirm & Create Bill
            </button>
          )}
          {row.status === 'CONFIRMED' && (
            <span className="text-xs text-sky-600 font-semibold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Bill Created
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
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Purchase Orders (PO)</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Vendor Purchase Orders & Automatic Bill Generation</p>
        </div>
        {!isContact && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </button>
        )}
      </div>

      <Table columns={columns} data={purchaseOrders} onRowClick={(row) => setSelectedPO(row)} />

      {/* Create Purchase Order Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Purchase Order" maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Vendor Name</label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                {contacts.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.userType})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">PO Date</label>
              <input
                type="text"
                disabled
                value={new Date().toLocaleDateString('en-GB')}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Purchase Line Items</label>
            <OrderLineItemsTable items={items} onChange={setItems} isPurchase={true} />
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
              Save Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Full Odoo Style Form View Modal for Purchase Order */}
      <Modal
        isOpen={Boolean(selectedPO)}
        onClose={() => setSelectedPO(null)}
        title={`Form View: Purchase Order ${selectedPO?.po_number || (selectedPO?.purchase_id ? `PO #${selectedPO.purchase_id}` : `PO-${selectedPO?._id?.slice(-5) || ''}`)}`}
        maxWidth="max-w-4xl"
      >
        {selectedPO && (
          <div className="space-y-6">
            {/* Top Stage Bar & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                {selectedPO.status === 'DRAFT' && !isContact && (
                  <button
                    onClick={() => { confirmPurchaseOrder(selectedPO._id); setSelectedPO(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4" /> Create Bill
                  </button>
                )}
                {selectedPO.status === 'CONFIRMED' && (
                  <span className="px-3 py-1.5 bg-sky-100 text-sky-800 font-bold text-xs rounded-lg flex items-center gap-1.5 border border-sky-200">
                    <FileText className="w-4 h-4 text-sky-600" /> Vendor Bill Created
                  </span>
                )}
              </div>

              {/* Status Progression Bar */}
              <div className="flex items-center gap-1 text-xs font-semibold">
                {['DRAFT', 'CONFIRMED'].map((st, idx) => (
                  <React.Fragment key={st}>
                    <span className={`px-2.5 py-1 rounded-md ${selectedPO.status === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200/60 text-slate-500'}`}>
                      {st}
                    </span>
                    {idx < 1 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Document Header Fields */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-semibold">PO Number:</span>
                <div className="text-lg font-bold text-slate-900">
                  {selectedPO.po_number || (selectedPO.purchase_id ? `PO #${selectedPO.purchase_id}` : `PO-${selectedPO._id?.slice(-5)}`)}
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Vendor Name:</span>
                <div className="text-base font-bold text-slate-800">
                  {selectedPO.vendor?.name || selectedPO.vendorName || 'Vendor'}
                </div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">PO Date:</span>
                <div className="font-semibold text-slate-700">{formatDate(selectedPO.date)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Total Amount:</span>
                <div className="text-lg font-extrabold text-emerald-700">
                  {formatCurrency(selectedPO.total_amount ?? selectedPO.total ?? 0)}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Purchase Line Items</h4>
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
                    {selectedPO.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400">{idx + 1}.</td>
                        <td className="p-2.5 font-semibold text-slate-800">
                          {item.product?.productName || item.productName || item.product}
                        </td>
                        <td className="p-2.5 text-slate-600">{item.accountName || item.account?.accountName || '-'}</td>
                        <td className="p-2.5 text-slate-600">{item.budgetAnalyticsName || item.budgetAnalytics?.name || (typeof item.budgetAnalytics === 'string' ? item.budgetAnalytics : '-')}</td>
                        <td className="p-2.5 text-center font-medium">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total ?? (item.quantity * item.unitPrice))}</td>
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
