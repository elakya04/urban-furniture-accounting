import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { CreditCard, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const PaymentsPage = () => {
  const { payments, contacts, processPayment } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'RECEIVE',
    partnerName: contacts[0]?.name || 'Partner',
    amount: '',
    payment_method: 'BANK',
    note: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    processPayment({
      partnerName: formData.partnerName,
      payment_method: formData.payment_method,
      amount: Number(formData.amount),
      type: formData.type,
      note: formData.note || `Manual ${formData.type} payment`
    });

    setIsAddModalOpen(false);
  };

  const columns = [
    {
      header: 'Payment Reference',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{row._id}</span>
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
    { header: 'Partner', accessor: 'partnerName' },
    { header: 'Payment Method', cell: (row) => <Badge status={row.payment_method} /> },
    { header: 'Amount', cell: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.amount)}</span> },
    { header: 'Date', cell: (row) => formatDate(row.date) },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Payments Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Cash and Bank Incoming / Outgoing Receipts</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          New Payment
        </button>
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
                <option value="RECEIVE">RECEIVE (Inflow)</option>
                <option value="SEND">SEND (Outflow)</option>
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

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Partner / Contact</label>
            <select
              value={formData.partnerName}
              onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            >
              {contacts.map(c => (
                <option key={c._id} value={c.name}>{c.name} ({c.userType})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount (Rs.)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="e.g. 10000"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Notes / Description</label>
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Direct cash payment for vendor settlement"
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
              Record Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
