import React from 'react';
import { useApp } from '../../context/AppContext';
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
  ArrowDownRight
} from 'lucide-react';

export const Dashboard = ({ onNavigate }) => {
  const { invoices, vendorBills, salesOrders, budgets, products, journalEntries } = useApp();

  const totalSalesRevenue = invoices
    .filter(i => i.status === 'PAID' || i.status === 'DUE')
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const outstandingReceivables = invoices
    .filter(i => i.status === 'DUE' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.amount_due || 0), 0);

  const outstandingPayables = vendorBills
    .filter(b => b.status === 'DUE' || b.status === 'OVERDUE')
    .reduce((sum, b) => sum + Number(b.amount_due || 0), 0);

  const activeBudgetsCount = budgets.filter(b => b.status === 'CONFIRMED').length;

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
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Accounting Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time overview of financial health, budgets & ledger activity.</p>
        </div>
        <div className="flex gap-2">
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
          value={formatCurrency(totalSalesRevenue)}
          subtitle="Invoiced & Paid Customer Revenue"
          icon={TrendingUp}
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(outstandingReceivables)}
          subtitle="Due from Customers"
          icon={Receipt}
        />
        <StatCard
          title="Outstanding Payables"
          value={formatCurrency(outstandingPayables)}
          subtitle="Due to Vendors"
          icon={DollarSign}
        />
        <StatCard
          title="Active Confirmed Budgets"
          value={activeBudgetsCount}
          subtitle="Monitored Analytic Budgets"
          icon={PieChart}
        />
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
