import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { computeProfitLoss } from '../../utils/accountingMath';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateReportPDF } from '../../utils/pdfExporter';
import { Printer, BarChart3, TrendingUp, TrendingDown, RefreshCw, Calendar, Filter } from 'lucide-react';

export const ProfitLossPage = () => {
  const { invoices, vendorBills, coa } = useApp();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfitLoss = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const res = await api.getProfitLossReport(params);
      if (res && res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.warn('[PROFIT_LOSS] Backend fetch error, falling back to local computation:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchProfitLoss();
  }, [fetchProfitLoss]);

  // Context fallback
  const fallbackPL = computeProfitLoss(invoices, vendorBills, coa);

  const totalIncome = reportData ? reportData.income : fallbackPL.totalIncome;
  const totalExpenses = reportData ? reportData.expenses : fallbackPL.totalExpenses;
  const netIncome = reportData ? reportData.netIncome : fallbackPL.netIncome;
  const isProfitable = netIncome >= 0;

  const handleExportPDF = () => {
    generateReportPDF('Profit and Loss Statement 2026', [
      { label: 'Income from Sales & Revenue', value: totalIncome },
      { label: 'Total Revenue / Income', value: totalIncome },
      { label: 'Operating & Purchase Expenses', value: totalExpenses },
      { label: 'NET INCOME / (LOSS)', value: netIncome }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Profit and Loss Statement (P&L)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Double-Entry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Automated Income vs Operating Expense Computation from General Ledger</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchProfitLoss}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh Report"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            Print / PDF Export
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Accounting Period:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="text-amber-600 hover:text-amber-700 font-semibold px-2 py-1"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="text-slate-400">
          Source: <strong className="text-slate-700">Posted Double-Entry Journals</strong>
        </div>
      </div>

      {/* Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-3xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-slate-900">URBAN FURNITURE ACCOUNTING</h3>
            <p className="text-xs text-slate-500">
              Statement of Profit and Loss {dateRange.startDate || dateRange.endDate ? `(${dateRange.startDate || 'Start'} to ${dateRange.endDate || 'Present'})` : 'for All Fiscal Periods'}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-700">INR (₹)</span>
        </div>

        {/* Income Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">1. Income</h4>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-700 font-medium">Operating Revenue & Sales Income</span>
            <span className="font-bold text-slate-800">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex justify-between text-sm py-2 font-bold text-slate-900 border-t border-slate-200 bg-slate-50 px-3 rounded-lg">
            <span>Total Income (A)</span>
            <span className="text-emerald-700">{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">2. Expenses</h4>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-700 font-medium">Cost of Goods Sold & Purchase Expenses</span>
            <span className="font-semibold text-slate-800">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="flex justify-between text-sm py-2 font-bold text-slate-900 border-t border-slate-200 bg-slate-50 px-3 rounded-lg">
            <span>Total Expenses (B)</span>
            <span className="text-rose-700">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

        {/* Net Income Summary */}
        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-base font-extrabold text-slate-900">NET INCOME / (LOSS)</div>
            <div className="text-xs text-slate-400">Total Income (A) - Total Expenses (B)</div>
          </div>
          <div className={`flex items-center gap-2 text-xl font-extrabold px-4 py-2 rounded-xl border ${isProfitable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {isProfitable ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-rose-600" />}
            {formatCurrency(netIncome)}
          </div>
        </div>
      </div>
    </div>
  );
};
