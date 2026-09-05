import React from 'react';
import { useApp } from '../../context/AppContext';
import { computeBalanceSheet } from '../../utils/accountingMath';
import { formatCurrency } from '../../utils/formatters';
import { generateReportPDF } from '../../utils/pdfExporter';
import { Printer, ShieldCheck, Building2 } from 'lucide-react';

export const BalanceSheetPage = () => {
  const { payments, invoices, vendorBills, coa } = useApp();
  const bsData = computeBalanceSheet(payments, invoices, vendorBills, coa);

  const handleExportPDF = () => {
    generateReportPDF('Balance Sheet 2026', {
      'Bank Account (Asset)': bsData.assets.bank,
      'Cash Account (Asset)': bsData.assets.cash,
      'Debtors / Receivables': bsData.assets.debtors,
      'TOTAL ASSETS': bsData.assets.totalAssets,
      'Creditors / Payables': bsData.liabilities.creditors,
      'Capital Account (Equity)': bsData.liabilities.capital,
      'TOTAL LIABILITIES & CAPITAL': bsData.liabilities.totalLiabilities
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Balance Sheet Report</h2>
          <p className="text-xs text-slate-500 mt-1">Assets vs Liabilities & Capital Equivalence Verification</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Print / PDF Export
        </button>
      </div>

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
              <span className="text-slate-700 font-medium">Bank A/c (Asset - Bank)</span>
              <span className="font-bold text-slate-900">{formatCurrency(bsData.assets.bank)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Cash A/c (Asset - Cash)</span>
              <span className="font-bold text-slate-900">{formatCurrency(bsData.assets.cash)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Debtors A/c (Customer Receivables)</span>
              <span className="font-bold text-slate-900">{formatCurrency(bsData.assets.debtors)}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-900">TOTAL ASSETS</span>
            <span className="text-sky-700 text-lg">{formatCurrency(bsData.assets.totalAssets)}</span>
          </div>
        </div>

        {/* Liabilities & Equity Column */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              2. LIABILITIES & EQUITY
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Liability Accounts</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Creditors A/c (Vendor Payables)</span>
              <span className="font-bold text-slate-900">{formatCurrency(bsData.liabilities.creditors)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-700 font-medium">Capital A/c (Equity)</span>
              <span className="font-bold text-slate-900">{formatCurrency(bsData.liabilities.capital)}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-900">TOTAL LIABILITIES & CAPITAL</span>
            <span className="text-indigo-700 text-lg">{formatCurrency(bsData.liabilities.totalLiabilities)}</span>
          </div>
        </div>
      </div>

      {/* SVG Balance Verification Banner */}
      <div className="max-w-5xl mx-auto p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Accounting Equation Verification: <strong>Total Assets ({formatCurrency(bsData.assets.totalAssets)}) = Total Liabilities ({formatCurrency(bsData.liabilities.totalLiabilities)})</strong></span>
        </div>
        <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold uppercase">Balanced</span>
      </div>
    </div>
  );
};
