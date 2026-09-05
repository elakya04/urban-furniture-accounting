import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Layers } from 'lucide-react';

export const JournalsPage = () => {
  const { journals, addJournal, coa } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ journalName: '', type: 'SALES', def_debitAcc: '', def_creditAcc: '' });

  const getAccName = (id) => coa.find(c => c._id === id)?.accountName || '-';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.journalName) return;
    addJournal(formData);
    setIsAddModalOpen(false);
    setFormData({ journalName: '', type: 'SALES', def_debitAcc: '', def_creditAcc: '' });
  };

  const columns = [
    {
      header: 'Journal Name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{row.journalName}</span>
        </div>
      )
    },
    { header: 'Type', cell: (row) => <Badge status={row.type} /> },
    { header: 'Default Debit Account', cell: (row) => getAccName(row.def_debitAcc) },
    { header: 'Default Credit Account', cell: (row) => getAccName(row.def_creditAcc) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Accounting Journals</h2>
          <p className="text-xs text-slate-500 mt-1">Configure Sales, Purchase, Cash & Bank Journal Defaults</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
        >
          <Plus className="w-4 h-4" />
          New Journal
        </button>
      </div>

      <Table columns={columns} data={journals} />

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Journal">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Journal Name</label>
            <input
              type="text"
              required
              value={formData.journalName}
              onChange={(e) => setFormData({ ...formData, journalName: e.target.value })}
              placeholder="e.g. Sales Journal"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Journal Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="SALES">SALES</option>
              <option value="PURCHASE">PURCHASE</option>
              <option value="BANK">BANK</option>
              <option value="CASH">CASH</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Default Debit Account</label>
              <select
                value={formData.def_debitAcc}
                onChange={(e) => setFormData({ ...formData, def_debitAcc: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Select COA Account</option>
                {coa.map(c => (
                  <option key={c._id} value={c._id}>{c.accountName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Default Credit Account</label>
              <select
                value={formData.def_creditAcc}
                onChange={(e) => setFormData({ ...formData, def_creditAcc: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">Select COA Account</option>
                {coa.map(c => (
                  <option key={c._id} value={c._id}>{c.accountName}</option>
                ))}
              </select>
            </div>
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
              Save Journal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
