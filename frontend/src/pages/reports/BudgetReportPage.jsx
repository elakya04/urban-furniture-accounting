import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateReportPDF } from '../../utils/pdfExporter';
import { Printer, PieChart, TrendingUp, RefreshCw, Calendar, Filter, Tag, CheckCircle2 } from 'lucide-react';

export const BudgetReportPage = () => {
  const { budgets, analyticAccounts } = useApp();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedAnalytic, setSelectedAnalytic] = useState('ALL');
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBudgetReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;
      if (selectedAnalytic && selectedAnalytic !== 'ALL') params.analyticAccount = selectedAnalytic;

      const res = await api.getBudgetSummaryReport(params);
      if (res && res.success && Array.isArray(res.report)) {
        setReportList(res.report);
      }
    } catch (err) {
      console.warn('[BUDGET_REPORT] Backend error, falling back to context data:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedAnalytic]);

  useEffect(() => {
    fetchBudgetReport();
  }, [fetchBudgetReport]);

  // Context fallback if backend list is empty
  const effectiveReports = reportList.length > 0
    ? reportList
    : budgets.map(b => {
        const committed = b.committed_amount || 0;
        const achieved = b.achieved_amount || 0;
        const remaining = committed - achieved;
        const percentage = committed > 0 ? (achieved / committed) * 100 : 0;
        return {
          id: b._id,
          name: b.name,
          analyticAccount: typeof b.analytics_account === 'object' ? b.analytics_account : { name: b.analytics_account || '-' },
          committed,
          achieved,
          remaining,
          percentage: Number(percentage.toFixed(2)),
          status: b.status
        };
      });

  const totalCommitted = effectiveReports.reduce((s, r) => s + (r.committed || 0), 0);
  const totalAchieved = effectiveReports.reduce((s, r) => s + (r.achieved || 0), 0);
  const totalRemaining = totalCommitted - totalAchieved;
  const overallPercentage = totalCommitted > 0 ? Math.round((totalAchieved / totalCommitted) * 100) : 0;

  const handleExportPDF = () => {
    const items = [
      { label: 'Total Committed Budget', value: totalCommitted },
      { label: 'Total Achieved Expenditure', value: totalAchieved },
      { label: 'Total Remaining Headroom', value: totalRemaining },
      ...effectiveReports.map(r => ({
        label: `${r.name} (${typeof r.analyticAccount === 'object' ? r.analyticAccount?.name : r.analyticAccount || 'General'})`,
        value: r.achieved
      }))
    ];
    generateReportPDF('Budget Utilization Report 2026', items);
  };

  const reportColumns = [
    {
      header: 'Budget Name',
      cell: (row) => (
        <div>
          <span className="font-bold text-slate-800">{row.name}</span>
          <span className="block text-[11px] text-slate-400">
            {typeof row.analyticAccount === 'object' ? row.analyticAccount?.name : row.analyticAccount || 'Unassigned'}
          </span>
        </div>
      )
    },
    {
      header: 'Committed Limit',
      cell: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.committed)}</span>
    },
    {
      header: 'Achieved / Spent',
      cell: (row) => <span className="font-bold text-amber-700">{formatCurrency(row.achieved)}</span>
    },
    {
      header: 'Remaining',
      cell: (row) => (
        <span className={`font-semibold ${row.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
          {formatCurrency(row.remaining)}
        </span>
      )
    },
    {
      header: 'Utilization',
      cell: (row) => {
        const pct = Math.min(100, Math.round(row.percentage || 0));
        return (
          <div className="w-36 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>{row.percentage}%</span>
              <span>{pct >= 100 ? 'Exceeded' : 'Under Limit'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Status',
      cell: (row) => <Badge status={row.status || 'CONFIRMED'} />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Budget Utilization Report</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated tracking of committed limits vs real expenditure across analytic accounts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchBudgetReport}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Committed Budget"
          value={formatCurrency(totalCommitted)}
          subtitle="Total allocated expenditure"
          icon={PieChart}
        />
        <StatCard
          title="Achieved / Incurred"
          value={formatCurrency(totalAchieved)}
          subtitle="Vendor bills & invoices linked"
          icon={TrendingUp}
        />
        <StatCard
          title="Remaining Balance"
          value={formatCurrency(totalRemaining)}
          subtitle="Unspent headroom"
          icon={Calendar}
        />
        <StatCard
          title="Corporate Utilization"
          value={`${overallPercentage}%`}
          subtitle="Aggregate budget consumption"
          icon={Tag}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Analytic:</label>
            <select
              value={selectedAnalytic}
              onChange={(e) => setSelectedAnalytic(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="ALL">All Analytic Accounts</option>
              {analyticAccounts.map(a => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
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
          {(dateRange.startDate || dateRange.endDate || selectedAnalytic !== 'ALL') && (
            <button
              onClick={() => {
                setDateRange({ startDate: '', endDate: '' });
                setSelectedAnalytic('ALL');
              }}
              className="text-amber-600 hover:text-amber-700 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
        <div className="text-slate-400">
          Showing <strong className="text-slate-700">{effectiveReports.length}</strong> budget lines
        </div>
      </div>

      {/* Reports Table */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Budget Variance & Performance
          </h3>
        </div>
        <Table
          columns={reportColumns}
          data={effectiveReports}
        />
      </Card>
    </div>
  );
};
