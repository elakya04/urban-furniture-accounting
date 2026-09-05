import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  ShoppingCart,
  PieChart,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  BarChart3,
  Building2,
  CheckCircle2
} from 'lucide-react';

export const Dashboard = ({ onNavigate }) => {
  const { invoices, vendorBills, salesOrders, budgets, products, journalEntries } = useApp();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      const res = await api.getDashboardSummary(params);
      if (res && res.success && res.summary) {
        setSummaryData(res.summary);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.warn('[DASHBOARD] Could not fetch live summary from backend, using context fallback:', err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Context-based fallbacks if live backend query is empty or failed
  const contextSales = invoices
    .filter(i => i.status === 'PAID' || i.status === 'DUE')
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const contextReceivables = invoices
    .filter(i => i.status === 'DUE' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.amount_due || 0), 0);

  const contextPayables = vendorBills
    .filter(b => b.status === 'DUE' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + Number(b.amount_due || 0), 0);

  const contextTotalPurchases = vendorBills
    .reduce((sum, b) => sum + Number(b.total || 0), 0);

  const activeBudgetsCount = budgets.filter(b => b.status === 'CONFIRMED').length;

  const totalSales = summaryData?.totalSales ?? contextSales;
  const totalPurchases = summaryData?.totalPurchases ?? contextTotalPurchases;
  const customerDues = summaryData?.customerDues ?? contextReceivables;
  const vendorDues = summaryData?.vendorDues ?? contextPayables;

  const budgetCommitted = summaryData?.budget?.committed ?? budgets.reduce((s, b) => s + (b.committed_amount || 0), 0);
  const budgetAchieved = summaryData?.budget?.achieved ?? budgets.reduce((s, b) => s + (b.achieved_amount || 0), 0);
  const budgetRemaining = summaryData?.budget?.remaining ?? (budgetCommitted - budgetAchieved);
  const budgetPercent = budgetCommitted > 0 ? Math.min(100, Math.round((budgetAchieved / budgetCommitted) * 100)) : 0;

  const invoiceColumns = [
    { header: 'Invoice No', cell: (row) => <span className="font-semibold text-slate-800">{row.inv_number}</span> },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Date', cell: (row) => formatDate(row.invoice_date) },
    { header: 'Total', cell: (row) => formatCurrency(row.total_amount) },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> }
  ];

  const RecentJournalColumns = [
    { header: 'Number', cell: (row) => <span className="font-semibold text-slate-800">{row.number}</span> },
    { header: 'Journal', accessor: 'journalName' },
    { header: 'Partner', accessor: 'partnerName' },
    { header: 'Date', cell: (row) => formatDate(row.date) },
    { header: 'Total', cell: (row) => formatCurrency(row.total) },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Accounting Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Backend
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial metrics, cash flow health & budget utilization.
            {lastUpdated && ` Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Filters */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${!dateRange.startDate && !dateRange.endDate ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Time
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                setDateRange({ startDate: start, endDate: end });
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${dateRange.startDate ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
          </div>

          <button
            onClick={fetchSummary}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            onClick={() => onNavigate('sales-orders')}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            New Sales Order
          </button>
          <button
            onClick={() => onNavigate('purchase-orders')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            New Purchase Order
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales Revenue"
          value={formatCurrency(totalSales)}
          subtitle="Invoiced & confirmed sales"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Purchases / Bills"
          value={formatCurrency(totalPurchases)}
          subtitle="Vendor bills & cost items"
          icon={DollarSign}
        />
        <StatCard
          title="Customer Dues (Receivables)"
          value={formatCurrency(customerDues)}
          subtitle="Awaiting customer payments"
          icon={Receipt}
        />
        <StatCard
          title="Vendor Dues (Payables)"
          value={formatCurrency(vendorDues)}
          subtitle="Outstanding to suppliers"
          icon={ArrowDownRight}
        />
      </div>

      {/* Budget Utilization Progress Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-600" />
              Corporate Budget Utilization
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking across confirmed analytic budgets
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Committed</span>
              <span className="font-bold text-slate-800">{formatCurrency(budgetCommitted)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Achieved</span>
              <span className="font-bold text-emerald-600">{formatCurrency(budgetAchieved)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] uppercase font-semibold">Remaining</span>
              <span className={`font-bold ${budgetRemaining >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                {formatCurrency(budgetRemaining)}
              </span>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-semibold text-xs transition-colors"
            >
              View Budgets
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Overall Utilization Rate</span>
            <span className="font-bold text-slate-900">{budgetPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                budgetPercent > 90 ? 'bg-rose-500' : budgetPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Navigation to Reports */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('profit-loss')}
          className="cursor-pointer group bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-xs hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
          <h4 className="font-bold text-base mt-3">Profit & Loss (P&L)</h4>
          <p className="text-xs text-slate-400 mt-1">Real-time revenue vs expense computation & net margins</p>
        </div>

        <div
          onClick={() => onNavigate('balance-sheet')}
          className="cursor-pointer group bg-white border border-slate-200 p-5 rounded-2xl text-slate-800 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <Building2 className="w-6 h-6 text-sky-600" />
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
          </div>
          <h4 className="font-bold text-base mt-3">Balance Sheet</h4>
          <p className="text-xs text-slate-500 mt-1">Assets vs Liabilities and Capital Equivalence Verification</p>
        </div>

        <div
          onClick={() => onNavigate('budget-report')}
          className="cursor-pointer group bg-white border border-slate-200 p-5 rounded-2xl text-slate-800 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <PieChart className="w-6 h-6 text-indigo-600" />
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 transition-colors" />
          </div>
          <h4 className="font-bold text-base mt-3">Budget Analysis Report</h4>
          <p className="text-xs text-slate-500 mt-1">Detailed breakdown by analytic accounts and expenditure</p>
        </div>
      </div>

      {/* Dashboard Lists & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Customer Invoices</h3>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
            >
              View All
            </button>
          </div>
          <Table
            columns={invoiceColumns}
            data={invoices.slice(0, 5)}
            onRowClick={() => onNavigate('invoices')}
          />
        </Card>

        {/* Recent Journal Entries Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Posted Journal Entries</h3>
            <button
              onClick={() => onNavigate('journal-entries')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
            >
              View All
            </button>
          </div>
          <Table
            columns={RecentJournalColumns}
            data={journalEntries.slice(0, 5)}
            onRowClick={() => onNavigate('journal-entries')}
          />
        </Card>
      </div>
    </div>
  );
};
