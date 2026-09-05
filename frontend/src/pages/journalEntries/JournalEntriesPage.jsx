import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, History, RotateCcw, AlertTriangle, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { validateJournalEntryBalance } from '../../utils/accountingMath';

export const JournalEntriesPage = () => {
  const { journalEntries, coa, contacts, journals, addJournalEntry, reverseJournalEntry } = useApp();
  const { isContact, isAdmin, isAccountant } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJE, setSelectedJE] = useState(null);

  const [formData, setFormData] = useState({
    number: `JE/2026/${String(journalEntries.length + 1).padStart(4, '0')}`,
    date: new Date().toISOString().split('T')[0],
    journal: '',
    partnerName: ''
  });

  const [items, setItems] = useState([]);

  // Dynamically initialize defaults once master data loads
  useEffect(() => {
    if (!formData.journal && journals.length > 0) {
      setFormData(prev => ({
        ...prev,
        journal: journals[0]._id,
        partnerName: contacts[0]?.name || ''
      }));
    }
  }, [journals, contacts]);

  useEffect(() => {
    if (coa.length >= 2 && items.length === 0) {
      setItems([
        { account: coa[0]._id, partner: contacts[0]?.name || '', debit: 10000, credit: 0 },
        { account: coa[1]._id, partner: contacts[0]?.name || '', debit: 0, credit: 10000 }
      ]);
    }
  }, [coa, contacts, items.length]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { account: coa[0]?._id || '', partner: contacts[0]?.name || '', debit: 0, credit: 0 }]);
  };

  const removeItem = (idx) => {
    if (items.length <= 2) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const { totalDebit, totalCredit, isBalanced, difference } = validateJournalEntryBalance(items);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isBalanced) return;

    const journalObj = journals.find(j => j._id === formData.journal);

    const success = addJournalEntry({
      number: formData.number,
      date: formData.date,
      partnerName: formData.partnerName,
      journal: formData.journal,
      journalName: journalObj?.journalName || 'General',
      journalItems: items.map(i => ({
        account: i.account,
        accountName: coa.find(c => c._id === i.account)?.accountName || 'GL Account',
        debit: Number(i.debit || 0),
        credit: Number(i.credit || 0)
      }))
    });

    if (success) {
      setIsAddModalOpen(false);
    }
  };

  const columns = [
    {
      header: 'Entry Number',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {row.inv_bill || row.number || (row._id ? `JE-${row._id.slice(-6)}` : 'JE')}
          </span>
        </div>
      )
    },
    { header: 'Date', cell: (row) => formatDate(row.date) },
    {
      header: 'Journal',
      cell: (row) => <span>{row.journal?.journalName || row.journalName || 'General'}</span>
    },
    {
      header: 'Partner',
      cell: (row) => <span>{row.partnerName || row.sourceId?.vendorName || row.sourceId?.customerName || '-'}</span>
    },
    {
      header: 'Total (Debit = Credit)',
      cell: (row) => {
        const total = row.total ?? (row.journalItems || []).reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
        return <span className="font-bold text-slate-900">{formatCurrency(total)}</span>;
      }
    },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          {!row.number?.startsWith('REV/') && !isContact && (
            <button
              onClick={() => reverseJournalEntry(row._id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reverse
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Journal Entries (Double-Entry Ledger)</h2>
          <p className="text-xs text-slate-500 mt-1">Balanced Accounting Journal Entries with Real-time Reversal</p>
        </div>
        {!isContact && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            New Journal Entry
          </button>
        )}
      </div>

      <Table columns={columns} data={journalEntries} onRowClick={(row) => setSelectedJE(row)} />

      {/* New Journal Entry Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Post Double-Entry Journal" maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Journal</label>
              <select
                value={formData.journal}
                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
              >
                {journals.map(j => (
                  <option key={j._id} value={j._id}>{j.journalName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Partner</label>
              <select
                value={formData.partnerName}
                onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
              >
                {contacts.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase text-slate-500">Journal Lines (Debit / Credit)</label>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="px-3 py-2">Account (COA)</th>
                    <th className="px-3 py-2">Partner</th>
                    <th className="px-3 py-2 w-28">Debit (Rs.)</th>
                    <th className="px-3 py-2 w-28">Credit (Rs.)</th>
                    <th className="px-3 py-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-1.5">
                        <select
                          value={item.account}
                          onChange={(e) => handleItemChange(idx, 'account', e.target.value)}
                          className="w-full border border-slate-200 rounded p-1 text-xs"
                        >
                          {coa.map(c => (
                            <option key={c._id} value={c._id}>{c.accountName}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          value={item.partner}
                          onChange={(e) => handleItemChange(idx, 'partner', e.target.value)}
                          className="w-full border border-slate-200 rounded p-1 text-xs"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          value={item.debit}
                          onChange={(e) => handleItemChange(idx, 'debit', Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1 text-xs font-medium"
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          value={item.credit}
                          onChange={(e) => handleItemChange(idx, 'credit', Number(e.target.value))}
                          className="w-full border border-slate-200 rounded p-1 text-xs font-medium"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 2} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addItem}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              + Add Line
            </button>
          </div>

          {/* Strict Balance Warning Banner */}
          {!isBalanced ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Blocking Warning: Total Debit ({formatCurrency(totalDebit)}) must equal Total Credit ({formatCurrency(totalCredit)}). Difference: {formatCurrency(difference)}.</span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-xs font-semibold">
              <span>Balanced Journal Entry verified cleanly!</span>
              <span>Total: {formatCurrency(totalDebit)}</span>
            </div>
          )}

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
              disabled={!isBalanced}
              className="px-4 py-2 rounded-lg bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Post Journal Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Drawer */}
      <Modal
        isOpen={Boolean(selectedJE)}
        onClose={() => setSelectedJE(null)}
        title={`Journal Entry Details: ${selectedJE?.inv_bill || selectedJE?.number || (selectedJE?._id ? `JE-${selectedJE._id.slice(-6)}` : '')}`}
      >
        {selectedJE && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div><span className="text-slate-400">Date:</span> <span className="font-semibold text-slate-800">{formatDate(selectedJE.date)}</span></div>
              <div><span className="text-slate-400">Journal:</span> <span className="font-semibold text-slate-800">{selectedJE.journal?.journalName || selectedJE.journalName || 'General'}</span></div>
              <div><span className="text-slate-400">Partner:</span> <span className="font-semibold text-slate-800">{selectedJE.partnerName || selectedJE.sourceId?.vendorName || selectedJE.sourceId?.customerName || '-'}</span></div>
              <div><span className="text-slate-400">Status:</span> <Badge status={selectedJE.status} /></div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-slate-500">Journal Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2.5">Account</th>
                      <th className="p-2.5">Partner</th>
                      <th className="p-2.5 text-right">Debit</th>
                      <th className="p-2.5 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedJE.journalItems?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-medium text-slate-800">{item.account?.accountName || item.accountName || item.account}</td>
                        <td className="p-2.5 text-slate-500">{item.partner || '-'}</td>
                        <td className="p-2.5 text-right font-medium">{item.debit ? formatCurrency(item.debit) : '-'}</td>
                        <td className="p-2.5 text-right font-medium">{item.credit ? formatCurrency(item.credit) : '-'}</td>
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
