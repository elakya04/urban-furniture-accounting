import React from 'react';
import { useApp } from '../../context/AppContext';
import { computeProfitLoss } from '../../utils/accountingMath';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateReportPDF } from '../../utils/pdfExporter';
import { Printer, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

export const ProfitLossPage = () => {
  const { invoices, vendorBills, coa } = useApp();
  const plData = computeProfitLoss(invoices, vendorBills, coa);

  const handleExportPDF = () => {
    generateReportPDF('Profit and Loss Statement 2026', [
      { label: 'Income from Sales', value: plData.salesIncome },
      { label: 'Total Revenue / Income', value: plData.totalIncome },
      { label: 'Purchase Expense', value: plData.purchaseExpense },
      { label: 'Other Expense', value: plData.otherExpense },
      { label: 'Total Operating Expenses', value: plData.totalExpenses },
      { label: 'NET INCOME / (LOSS)', value: plData.netIncome }
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Profit and Loss Statement (P&L)</h2>
          <p className="text-xs text-slate-500 mt-1">Financial Year 2026 • Income vs Operating Expense Computation</p>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Print / PDF Export
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-3xl mx-auto space-y-6">
        <div className="border-b border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-slate-900">URBAN FURNITURE ACCOUNTING</h3>
            <p className="text-xs text-slate-500">Statement of Profit and Loss for Period Ended 2026</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-700">INR (Rs.)</span>
        </div>

        {/* Income Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">1. Income</h4>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-700 font-medium">Income from Sales</span>
            <span className="font-bold text-slate-800">{formatCurrency(plData.salesIncome)}</span>
          </div>
          <div className="flex justify-between text-sm py-2 font-bold text-slate-900 border-t border-slate-200 bg-slate-50 px-3 rounded-lg">
            <span>Total Income (A)</span>
            <span className="text-emerald-700">{formatCurrency(plData.totalIncome)}</span>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">2. Expenses</h4>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-700 font-medium">Purchase Expense</span>
            <span className="font-semibold text-slate-800">{formatCurrency(plData.purchaseExpense)}</span>
          </div>
          <div className="flex justify-between text-xs py-1">
            <span className="text-slate-700 font-medium">Other Operating Expenses</span>
            <span className="font-semibold text-slate-800">{formatCurrency(plData.otherExpense)}</span>
          </div>
          <div className="flex justify-between text-sm py-2 font-bold text-slate-900 border-t border-slate-200 bg-slate-50 px-3 rounded-lg">
            <span>Total Expenses (B)</span>
            <span className="text-rose-700">{formatCurrency(plData.totalExpenses)}</span>
          </div>
        </div>

        {/* Net Income Summary */}
        <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center">
          <div>
            <div className="text-base font-extrabold text-slate-900">NET INCOME / (LOSS)</div>
            <div className="text-xs text-slate-400">Difference of Income - Expenses</div>
          </div>
          <div className={`text-xl font-extrabold px-4 py-2 rounded-xl border ${plData.netIncome >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {formatCurrency(plData.netIncome)}
          </div>
        </div>
      </div>
    </div>
  );
};
