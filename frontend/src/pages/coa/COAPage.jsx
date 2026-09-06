import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, BookOpen, Archive } from 'lucide-react';

export const COAPage = () => {
  const { coa, addCOA, toggleAccountStatus } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ accountName: '', type: 'ASSET' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.accountName) return;
    addCOA(formData);
    setIsAddModalOpen(false);
    setFormData({ accountName: '', type: 'ASSET' });
  };

  const columns = [
    {
      header: 'Account Name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{row.accountName}</span>
        </div>
      )
    },
    { header: 'Account Type', cell: (row) => <Badge status={row.type} /> },
    {
      header: 'Status',
      cell: (row) => (
        <button
          onClick={() => toggleAccountStatus(row._id, row.isActive)}
          title="Click to toggle status"
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
        </button>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => toggleAccountStatus(row._id, row.isActive)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
            row.isActive
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
          }`}
          title={row.isActive ? 'Archive Account' : 'Activate Account'}
        >
          <Archive className="w-3 h-3" />
          {row.isActive ? 'Archive' : 'Activate'}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Chart of Accounts (COA)</h2>
          <p className="text-xs text-slate-500 mt-1">Pre-configured General Ledger Accounts & Classifications</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      <Table columns={columns} data={coa} />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New COA Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Account Name *</label>
            <input
              type="text"
              required
              value={formData.accountName}
              onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
              placeholder="Enter account name"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Account Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="ASSET">ASSET</option>
              <option value="LIABILITY">LIABILITY</option>
              <option value="EXPENSE">EXPENSE</option>
              <option value="INCOME">INCOME</option>
              <option value="CAPITAL">CAPITAL</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Standard 5-category accounting classification.</p>
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
              Save Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
