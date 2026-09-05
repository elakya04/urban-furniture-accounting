import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { CreditCard, ArrowUpRight, ArrowDownRight, Plus, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentsPage = () => {
  const { payments, invoices, vendorBills, contacts, processPayment } = useApp();
  const { isContact, isAdmin, isAccountant } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'RECEIVE',
    invoiceBill: '',
    vendorbill: '',
    partnerName: '',
    amount: '',
    payment_method: 'BANK',
    note: ''
  });

  // Filter eligible open documents
  const openInvoices = invoices.filter(inv => inv.status !== 'CANCEL' && inv.status !== 'DRAFT');
  const openVendorBills = vendorBills.filter(b => b.status !== 'CANCELLED' && b.status !== 'DRAFT');

  // When changing type, set default document
  useEffect(() => {
    if (formData.type === 'RECEIVE') {
      const firstInv = openInvoices[0];
      if (firstInv) {
        setFormData(prev => ({
          ...prev,
          invoiceBill: firstInv._id,
          vendorbill: '',
          partnerName: firstInv.customerName || 'Customer',
          amount: firstInv.amount_due ?? firstInv.total_amount ?? ''
        }));
      }
    } else {
      const firstBill = openVendorBills[0];
      if (firstBill) {
        setFormData(prev => ({
          ...prev,
          invoiceBill: '',
          vendorbill: firstBill._id,
          partnerName: firstBill.vendor?.name || firstBill.vendorName || 'Vendor',
          amount: firstBill.amount_due ?? firstBill.total ?? ''
        }));
      }
    }
  }, [formData.type, invoices.length, vendorBills.length]);

  const handleInvoiceChange = (invId) => {
    const inv = invoices.find(i => i._id === invId);
    setFormData(prev => ({
      ...prev,
      invoiceBill: invId,
      partnerName: inv?.customerName || 'Customer',
      amount: inv ? (inv.amount_due ?? inv.total_amount) : prev.amount
    }));
  };

  const handleBillChange = (billId) => {
    const bill = vendorBills.find(b => b._id === billId);
    setFormData(prev => ({
      ...prev,
      vendorbill: billId,
      partnerName: bill?.vendor?.name || bill?.vendorName || 'Vendor',
      amount: bill ? (bill.amount_due ?? bill.total) : prev.amount
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    try {
      await processPayment({
        invoiceBill: formData.type === 'RECEIVE' ? formData.invoiceBill : undefined,
        vendorbill: formData.type === 'SEND' ? formData.vendorbill : undefined,
        partnerName: formData.partnerName,
        payment_method: formData.payment_method,
        amount: Number(formData.amount),
        type: formData.type,
        note: formData.note || `Manual ${formData.type} payment`
      });
      setIsAddModalOpen(false);
    } catch (err) {
      // Error handled by app context toast
    }
  };

  const columns = [
    {
      header: 'Payment Reference',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {row._id ? (row._id.startsWith('pay_') ? row._id.slice(4, 12).toUpperCase() : row._id.slice(-8).toUpperCase()) : 'PAY'}
          </span>
        </div>
      )
    },
    {
      header: 'Type',
      cell: (row) => (
        <div className="flex items-center gap-1 font-semibold text-xs">
          {row.type === 'RECEIVE' ? (
            <span className="text-emerald-600 flex items-center gap-0.5"><ArrowDownRight className="w-3.5 h-3.5" /> RECEIVE</span>
          ) : (
            <span className="text-rose-600 flex items-center gap-0.5"><ArrowUpRight className="w-3.5 h-3.5" /> SEND</span>
          )}
        </div>
      )
    },
    {
      header: 'Linked Document',
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <FileText className="w-3.5 h-3.5 text-sky-600" />
          <span>
            {row.invoiceBill?.inv_number ||
             row.vendorbill?.bill_number ||
             (typeof row.invoiceBill === 'string' ? row.invoiceBill : null) ||
             (typeof row.vendorbill === 'string' ? row.vendorbill : null) ||
             (row.type === 'RECEIVE' ? 'Customer Invoice' : 'Vendor Bill')}
          </span>
        </div>
      )
    },
    {
      header: 'Partner',
      cell: (row) => (
        <span>
          {row.invoiceBill?.customerName ||
           row.vendorbill?.vendor?.name ||
           row.vendorbill?.vendorName ||
           row.partnerName ||
           'Partner'}
        </span>
      )
    },
    { header: 'Method', cell: (row) => <Badge status={row.payment_method} /> },
    { header: 'Amount', cell: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.amount)}</span> },
    { header: 'Date', cell: (row) => formatDate(row.date || row.createdAt) },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Payments Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Cash and Bank Incoming / Outgoing Receipts with Auto Journal Sync</p>
        </div>
        {!isContact && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            New Payment
          </button>
        )}
      </div>

      <Table columns={columns} data={payments} />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Direct Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="RECEIVE">RECEIVE (From Customer Invoice)</option>
                <option value="SEND">SEND (For Vendor Bill)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Method</label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="BANK">BANK</option>
                <option value="CASH">CASH</option>
              </select>
            </div>
          </div>

          {formData.type === 'RECEIVE' ? (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Customer Invoice</label>
              <select
                value={formData.invoiceBill}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-medium"
              >
                {openInvoices.map(inv => (
                  <option key={inv._id} value={inv._id}>
                    {inv.inv_number} — {inv.customerName || 'Customer'} (Due: Rs. {Number(inv.amount_due ?? inv.total_amount).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Vendor Bill</label>
              <select
                value={formData.vendorbill}
                onChange={(e) => handleBillChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-medium"
              >
                {openVendorBills.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.bill_number} — {b.vendor?.name || b.vendorName || 'Vendor'} (Due: Rs. {Number(b.amount_due ?? b.total).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Partner / Beneficiary</label>
            <input
              type="text"
              readOnly
              value={formData.partnerName}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount (Rs.)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notes / Description</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Enter remarks or description"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
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
              Confirm & Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
