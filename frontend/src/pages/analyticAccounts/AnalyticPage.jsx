import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Tag } from 'lucide-react';

export const AnalyticPage = () => {
  const { analyticAccounts, addAnalyticAccount } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'EXPENSE' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;
    addAnalyticAccount(formData);
    setIsAddModalOpen(false);
    setFormData({ name: '', type: 'EXPENSE' });
  };

  const columns = [
    {
      header: 'Analytic Account Name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      )
    },
    { header: 'Type', cell: (row) => <Badge status={row.type} /> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Analytic Accounts Master</h2>
          <p className="text-xs text-slate-500 mt-1">Tag revenue & expenses to cost centers, projects & departments</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          New Analytic Account
        </button>
      </div>

      <Table columns={columns} data={analyticAccounts} />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Analytic Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Analytic Account Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter analytic account name"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="EXPENSE">EXPENSE</option>
              <option value="INCOME">INCOME</option>
            </select>
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
              Save Analytic Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
