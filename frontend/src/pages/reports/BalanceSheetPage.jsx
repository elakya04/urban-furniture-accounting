import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { computeBalanceSheet } from '../../utils/accountingMath';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateReportPDF } from '../../utils/pdfExporter';
import { Printer, ShieldCheck, Building2, RefreshCw, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export const BalanceSheetPage = () => {
  const { payments, invoices, vendorBills, coa } = useApp();

  const [asOfDate, setAsOfDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalanceSheet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (asOfDate) params.asOfDate = asOfDate;

      const res = await api.getBalanceSheetReport(params);
      if (res && res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.warn('[BALANCE_SHEET] Backend fetch error, falling back to local computation:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [asOfDate]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [fetchBalanceSheet]);

  // Context fallback
  const fallbackBS = computeBalanceSheet(payments, invoices, vendorBills, coa);

  const totalAssets = reportData ? reportData.assets : fallbackBS.assets.totalAssets;
  const totalLiabilities = reportData ? reportData.liabilities : fallbackBS.liabilities.creditors;
  const totalCapital = reportData ? reportData.capital : fallbackBS.liabilities.capital;
  const totalLiabilitiesAndCapital = reportData ? reportData.totalLiabilitiesAndCapital : fallbackBS.liabilities.totalLiabilities;

  const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndCapital) < 0.01;

  const handleExportPDF = () => {
    generateReportPDF('Balance Sheet 2026', {
      'TOTAL ASSETS': totalAssets,
      'Total Liabilities': totalLiabilities,
      'Capital Account (Equity)': totalCapital,
      'TOTAL LIABILITIES & CAPITAL': totalLiabilitiesAndCapital,
      'STATUS': isBalanced ? 'BALANCED' : 'UNBALANCED'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Balance Sheet Report</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Double-Entry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Assets vs Liabilities & Capital Equivalence Verification</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchBalanceSheet}
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            <span>As of Date:</span>
          </div>
          <input
            type="date"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {asOfDate && (
            <button
              onClick={() => setAsOfDate('')}
              className="text-amber-600 hover:text-amber-700 font-semibold px-2 py-1"
            >
              Latest Closing
            </button>
          )}
        </div>
        <div className="text-slate-400">
          Source: <strong className="text-slate-700">General Ledger Accounts</strong>
        </div>
      </div>

      {/* Balance Sheet Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Assets Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-600" />
              1. ASSETS
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Asset Accounts</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Bank & Liquid Accounts (Asset - Bank)</span>
              <span className="font-bold text-slate-900">{formatCurrency(fallbackBS.assets.bank)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Cash Accounts (Asset - Cash)</span>
              <span className="font-bold text-slate-900">{formatCurrency(fallbackBS.assets.cash)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Debtors / Accounts Receivable</span>
              <span className="font-bold text-slate-900">{formatCurrency(fallbackBS.assets.debtors)}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-900">TOTAL ASSETS</span>
            <span className="text-sky-700 text-lg">{formatCurrency(totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities & Equity Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              2. LIABILITIES & EQUITY
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Liability & Capital Accounts</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Creditors / Accounts Payable</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalLiabilities)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Capital / Owner's Equity</span>
              <span className="font-bold text-slate-900">{formatCurrency(totalCapital)}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-900">TOTAL LIABILITIES & CAPITAL</span>
            <span className="text-indigo-700 text-lg">{formatCurrency(totalLiabilitiesAndCapital)}</span>
          </div>
        </div>
      </div>

      {/* Accounting Verification Banner */}
      <div className={`max-w-5xl mx-auto p-4 border rounded-2xl flex items-center justify-between text-xs font-medium ${
        isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
      }`}>
        <div className="flex items-center gap-2">
          {isBalanced ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>
            Accounting Equation Verification: <strong>Total Assets ({formatCurrency(totalAssets)}) {isBalanced ? '=' : '≠'} Total Liabilities & Capital ({formatCurrency(totalLiabilitiesAndCapital)})</strong>
          </span>
        </div>
        <span className={`px-3 py-1 text-white rounded-full font-bold uppercase ${
          isBalanced ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {isBalanced ? 'Balanced' : 'Discrepancy'}
        </span>
      </div>
    </div>
  );
};
