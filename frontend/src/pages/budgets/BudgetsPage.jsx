import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ViewToggle } from '../../components/common/ViewToggle';
import { Table } from '../../components/common/Table';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { computeBudgetMetrics } from '../../utils/accountingMath';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, PieChart, CheckCircle, RotateCcw, Link as LinkIcon, ExternalLink, ArrowRight, User, Calendar, Tag } from 'lucide-react';

export const BudgetsPage = () => {
  const { budgets, analyticAccounts, invoices, vendorBills, users, addBudget, confirmBudget, reviseBudget } = useApp();
  const { isContact, isAdmin, isAccountant } = useAuth();
  const [view, setView] = useState('list'); // list or kanban
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [selectedBudgetForForm, setSelectedBudgetForForm] = useState(null);
  const [selectedBudgetForRevise, setSelectedBudgetForRevise] = useState(null);
  const [achievedListModalBudget, setAchievedListModalBudget] = useState(null);
  const [analyticFilter, setAnalyticFilter] = useState('ALL');

  const [newLimitInput, setNewLimitInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    analytics_account: '',
    start_date: '',
    end_date: '',
    type: 'EXPENSE',
    committed_amount: '',
    responsiblePerson: ''
  });

  // Dynamically set defaults once master data loads
  useEffect(() => {
    if (!formData.analytics_account && analyticAccounts.length > 0) {
      setFormData(prev => ({
        ...prev,
        analytics_account: analyticAccounts[0]._id
      }));
    }
  }, [analyticAccounts, formData.analytics_account]);

  useEffect(() => {
    if (!formData.responsiblePerson && users.length > 0) {
      setFormData(prev => ({
        ...prev,
        responsiblePerson: users[0]._id
      }));
    }
  }, [users, formData.responsiblePerson]);

  const getAnalyticName = (id) => {
    if (!id) return '-';
    if (typeof id === 'object') return id.name || '-';
    return analyticAccounts.find(a => a._id === id)?.name || id || '-';
  };

  const getUserName = (id) => {
    if (!id) return 'System Admin';
    if (typeof id === 'object') return id.name || id.role || 'Admin';
    return users.find(u => u._id === id)?.name || 'System Admin';
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.committed_amount) return;

    addBudget({
      ...formData,
      committed_amount: Number(formData.committed_amount)
    });

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      analytics_account: analyticAccounts[0]?._id || '',
      start_date: '',
      end_date: '',
      type: 'EXPENSE',
      committed_amount: '',
      responsiblePerson: users[0]?._id || ''
    });
  };

  const handleReviseSubmit = (e) => {
    e.preventDefault();
    if (!selectedBudgetForRevise || !newLimitInput) return;

    reviseBudget(selectedBudgetForRevise._id, Number(newLimitInput));
    setIsReviseModalOpen(false);
    setSelectedBudgetForRevise(null);
    setSelectedBudgetForForm(null);
  };

  const getMatchingInvoicesAndBills = (budget) => {
    if (!budget) return [];
    const analyticName = getAnalyticName(budget.analytics_account);
    const analyticId = typeof budget.analytics_account === 'object' ? budget.analytics_account._id : budget.analytics_account;
    const start = new Date(budget.start_date);
    const end = new Date(budget.end_date);

    if (budget.type === 'INCOME') {
      return invoices.filter(inv => {
        const d = new Date(inv.invoice_date || inv.createdAt);
        if (d >= start && d <= end) {
          return inv.items?.some(i => i.budgetAnalytics === analyticId || i.budgetAnalytics === analyticName);
        }
        return false;
      });
    } else {
      return vendorBills.filter(bill => {
        const d = new Date(bill.bill_date || bill.createdAt);
        if (d >= start && d <= end) {
          return bill.items?.some(i => i.budgetAnalytics === analyticId || i.budgetAnalytics === analyticName);
        }
        return false;
      });
    }
  };

  const displayBudgets = analyticFilter === 'ALL'
    ? budgets
    : budgets.filter(b => getAnalyticName(b.analytics_account) === analyticFilter);

  const columns = [
    {
      header: 'Budget Name',
      cell: (row) => {
        const revisedChild = row.revisedWith ? budgets.find(b => b._id === row.revisedWith) : null;
        const originalParent = row.revisionOf ? budgets.find(b => b._id === row.revisionOf) : null;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-800">{row.name}</span>
            </div>

            {revisedChild && (
              <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1">
                <LinkIcon className="w-3 h-3" />
                <span>Revised With: <button onClick={(e) => { e.stopPropagation(); setSelectedBudgetForForm(revisedChild); }} className="underline font-bold">{revisedChild.name}</button></span>
              </div>
            )}
            {originalParent && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-slate-400" />
                <span>Revision Of: <button onClick={(e) => { e.stopPropagation(); setSelectedBudgetForForm(originalParent); }} className="underline font-medium text-slate-700">{originalParent.name}</button></span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      header: 'Analytic Account',
      cell: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setAnalyticFilter(getAnalyticName(row.analytics_account)); }}
          className="font-medium text-slate-700 hover:text-amber-600 flex items-center gap-1"
          title="Click to filter all budgets for this Analytic Account"
        >
          <Tag className="w-3 h-3 text-slate-400" />
          {getAnalyticName(row.analytics_account)}
        </button>
      )
    },
    { header: 'Type', cell: (row) => <Badge status={row.type} /> },
    { header: 'Start Date', cell: (row) => formatDate(row.start_date) },
    { header: 'End Date', cell: (row) => formatDate(row.end_date) },
    { header: 'Committed Limit', cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.committed_amount)}</span> },
    {
      header: 'Achieved Amount',
      cell: (row) => {
        if (row.status !== 'CONFIRMED' && row.status !== 'REVISED') return <span className="text-slate-400 text-xs">Only at Confirmed</span>;
        const { achievedAmount } = computeBudgetMetrics(row, invoices, vendorBills);
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setAchievedListModalBudget(row); }}
            className="font-bold text-amber-700 hover:underline inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
            title="Click to view detailed matching Invoices/Bills"
          >
            {formatCurrency(achievedAmount)}
            <ExternalLink className="w-3 h-3 text-amber-600" />
          </button>
        );
      }
    },
    {
      header: 'Achieved %',
      cell: (row) => {
        if (row.status !== 'CONFIRMED' && row.status !== 'REVISED') return '-';
        const { achievedPercent } = computeBudgetMetrics(row, invoices, vendorBills);
        return (
          <div className="w-28 space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-800">
              <span>{achievedPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-300 ${achievedPercent > 90 ? 'bg-rose-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, achievedPercent)}%` }}
              />
            </div>
          </div>
        );
      }
    },
    { header: 'Stage Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'DRAFT' && !isContact && (
            <button
              onClick={() => confirmBudget(row._id)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
            >
              Confirm
            </button>
          )}

          {row.status === 'CONFIRMED' && !isContact && (
            <button
              onClick={() => { setSelectedBudgetForRevise(row); setNewLimitInput(row.committed_amount + 50000); setIsReviseModalOpen(true); }}
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Revise
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Budget & Analytic Reports</h2>
          <p className="text-xs text-slate-500 mt-1">Track Committed Limits vs Live Achieved Amounts across Analytic Accounts</p>
        </div>

        <div className="flex items-center gap-3">
          {analyticFilter !== 'ALL' && (
            <button
              onClick={() => setAnalyticFilter('ALL')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Reset Filter ({analyticFilter})
            </button>
          )}
          <ViewToggle currentView={view} onViewChange={setView} />
          {!isContact && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Create Budget
            </button>
          )}
        </div>
      </div>

      {/* Render List View */}
      {view === 'list' && (
        <Table columns={columns} data={displayBudgets} onRowClick={(row) => setSelectedBudgetForForm(row)} />
      )}

      {/* Render Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayBudgets.map(budget => {
            const { achievedAmount, achievedPercent, amountToAchieve } = computeBudgetMetrics(budget, invoices, vendorBills);
            const isConfirmed = budget.status === 'CONFIRMED' || budget.status === 'REVISED';

            return (
              <Card key={budget._id} onClick={() => setSelectedBudgetForForm(budget)} className="space-y-4 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-amber-600" />
                      {budget.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Analytic: {getAnalyticName(budget.analytics_account)}</p>
                  </div>
                  <Badge status={budget.status} />
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Budget Period:</span>
                    <span className="font-medium text-slate-700">{formatDate(budget.start_date)} to {formatDate(budget.end_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Committed Amount:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(budget.committed_amount)}</span>
                  </div>
                  {isConfirmed && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Achieved Amount:</span>
                        <span className="font-bold text-amber-700">{formatCurrency(achievedAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Amount To Achieve:</span>
                        <span className="font-medium text-slate-700">{formatCurrency(amountToAchieve)}</span>
                      </div>
                    </>
                  )}
                </div>

                {isConfirmed && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Progress</span>
                      <span>{achievedPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, achievedPercent)}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Odoo Style Form View Modal of Budget */}
      <Modal isOpen={Boolean(selectedBudgetForForm)} onClose={() => setSelectedBudgetForForm(null)} title={`Form View of Budget: ${selectedBudgetForForm?.name || ''}`} maxWidth="max-w-4xl">
        {selectedBudgetForForm && (() => {
          const { achievedAmount, achievedPercent, amountToAchieve } = computeBudgetMetrics(selectedBudgetForForm, invoices, vendorBills);
          const revisedChild = selectedBudgetForForm.revisedWith ? budgets.find(b => b._id === selectedBudgetForForm.revisedWith) : null;
          const originalParent = selectedBudgetForForm.revisionOf ? budgets.find(b => b._id === selectedBudgetForForm.revisionOf) : null;

          return (
            <div className="space-y-6">
              {/* Stage Progress Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  {selectedBudgetForForm.status === 'DRAFT' && !isContact && (
                    <button
                      onClick={() => { confirmBudget(selectedBudgetForForm._id); setSelectedBudgetForForm(null); }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      Confirm Budget
                    </button>
                  )}
                  {selectedBudgetForForm.status === 'CONFIRMED' && !isContact && (
                    <button
                      onClick={() => { setSelectedBudgetForRevise(selectedBudgetForForm); setNewLimitInput(selectedBudgetForForm.committed_amount + 50000); setIsReviseModalOpen(true); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" /> Revise Budget
                    </button>
                  )}
                </div>

                {/* Stages */}
                <div className="flex items-center gap-1 text-xs font-semibold">
                  {['DRAFT', 'CONFIRMED', 'REVISED', 'CANCELLED'].map((st, idx) => (
                    <React.Fragment key={st}>
                      <span className={`px-2.5 py-1 rounded-md ${selectedBudgetForForm.status === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200/60 text-slate-500'}`}>
                        {st}
                      </span>
                      {idx < 3 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-3 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Budget Name:</span>
                  <div className="text-base font-bold text-slate-900">{selectedBudgetForForm.name}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Responsible:</span>
                  <div className="font-semibold text-slate-800">{getUserName(selectedBudgetForForm.responsiblePerson)}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Analytic Account:</span>
                  <div className="font-bold text-amber-700">{getAnalyticName(selectedBudgetForForm.analytics_account)}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Budget Period:</span>
                  <div className="font-semibold text-slate-700">{formatDate(selectedBudgetForForm.start_date)} to {formatDate(selectedBudgetForForm.end_date)}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Budget Type:</span>
                  <div className="font-bold text-slate-800">{selectedBudgetForForm.type}</div>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Stage Status:</span>
                  <div><Badge status={selectedBudgetForForm.status} /></div>
                </div>
              </div>

              {/* Links Banner */}
              {(revisedChild || originalParent) && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                  {revisedChild && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                      <span>Revised With: <button onClick={() => setSelectedBudgetForForm(revisedChild)} className="font-bold underline text-indigo-700">{revisedChild.name}</button> (Click to open revised budget form view)</span>
                    </div>
                  )}
                  {originalParent && (
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-indigo-600" />
                      <span>Revision Of: <button onClick={() => setSelectedBudgetForForm(originalParent)} className="font-bold underline text-indigo-700">{originalParent.name}</button> (Click to open original budget form view)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Form Metrics Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="p-3">Analytic</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Committed Amount</th>
                      <th className="p-3 text-right">Achieved Amount</th>
                      <th className="p-3 text-center">Achieved %</th>
                      <th className="p-3 text-right">Amount To Achieve</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white font-medium">
                      <td className="p-3 font-bold text-slate-900">{getAnalyticName(selectedBudgetForForm.analytics_account)}</td>
                      <td className="p-3"><Badge status={selectedBudgetForForm.type} /></td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(selectedBudgetForForm.committed_amount)}</td>
                      <td className="p-3 text-right font-bold text-amber-700">
                        {selectedBudgetForForm.status === 'DRAFT' ? '-' : (
                          <button
                            onClick={() => setAchievedListModalBudget(selectedBudgetForForm)}
                            className="underline hover:text-amber-800"
                          >
                            {formatCurrency(achievedAmount)}
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">
                        {selectedBudgetForForm.status === 'DRAFT' ? '-' : `${achievedPercent}%`}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {selectedBudgetForForm.status === 'DRAFT' ? '-' : formatCurrency(amountToAchieve)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Create New Budget Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Fresh Budget">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Budget Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter budget name"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Analytic Account</label>
              <select
                value={formData.analytics_account}
                onChange={(e) => setFormData({ ...formData, analytics_account: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                {analyticAccounts.map(a => (
                  <option key={a._id} value={a._id}>{a.name} ({a.type})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Budget Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="EXPENSE">EXPENSE</option>
                <option value="INCOME">INCOME</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Committed Amount (Rs.)</label>
            <input
              type="number"
              required
              min="1"
              value={formData.committed_amount}
              onChange={(e) => setFormData({ ...formData, committed_amount: e.target.value })}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
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
              Save Fresh Budget
            </button>
          </div>
        </form>
      </Modal>

      {/* Revise Budget Modal */}
      <Modal isOpen={isReviseModalOpen} onClose={() => setIsReviseModalOpen(false)} title={`Revise Budget: ${selectedBudgetForRevise?.name || ''}`}>
        {selectedBudgetForRevise && (
          <form onSubmit={handleReviseSubmit} className="space-y-4">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950 space-y-1">
              <p className="font-semibold">SVG Specification for Budget Revision:</p>
              <p>Revising will move original budget <strong>"{selectedBudgetForRevise.name}"</strong> to REVISED state and create a new active budget <strong>"{selectedBudgetForRevise.name} Revised"</strong> with bidirectional links!</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Original Limit</label>
              <input
                type="text"
                disabled
                value={formatCurrency(selectedBudgetForRevise.committed_amount)}
                className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">New Committed Limit (Rs.)</label>
              <input
                type="number"
                required
                min="1"
                value={newLimitInput}
                onChange={(e) => setNewLimitInput(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-bold focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReviseModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                Confirm Revision
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Achieved Amount Drilldown Modal */}
      <Modal
        isOpen={Boolean(achievedListModalBudget)}
        onClose={() => setAchievedListModalBudget(null)}
        title={`Matching Invoices / Bills for ${achievedListModalBudget?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        {achievedListModalBudget && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              Showing all posted documents tagged with Analytic Account <strong>"{getAnalyticName(achievedListModalBudget.analytics_account)}"</strong> between {formatDate(achievedListModalBudget.start_date)} and {formatDate(achievedListModalBudget.end_date)}:
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="p-2.5">Document No</th>
                    <th className="p-2.5">Partner</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5 text-right">Total Amount</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getMatchingInvoicesAndBills(achievedListModalBudget).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No matching posted transactions found for this budget period.
                      </td>
                    </tr>
                  ) : (
                    getMatchingInvoicesAndBills(achievedListModalBudget).map((doc, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{doc.inv_number || doc.bill_number}</td>
                        <td className="p-2.5 text-slate-700">{doc.customerName || doc.vendorName}</td>
                        <td className="p-2.5 text-slate-500">{formatDate(doc.invoice_date || doc.bill_date)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(doc.total_amount || doc.total)}</td>
                        <td className="p-2.5"><Badge status={doc.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
