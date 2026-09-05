import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Receipt, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfExporter';

export const CustomerPortal = () => {
  const { invoices } = useApp();
  const { currentUser } = useAuth();

  // Filter invoices for active customer or show demo customer invoices
  const customerInvoices = invoices.filter(inv => {
    if (currentUser?.role === 'CONTACT') {
      return inv.customerName.toLowerCase().includes(currentUser.name.toLowerCase()) || inv.customerName.includes('Raj');
    }
    return true;
  });

  const columns = [
    {
      header: 'Invoice No',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">{row.inv_number}</span>
        </div>
      )
    },
    { header: 'Invoice Date', cell: (row) => formatDate(row.invoice_date) },
    { header: 'Due Date', cell: (row) => formatDate(row.due_date) },
    { header: 'Total Amount', cell: (row) => formatCurrency(row.total_amount) },
    { header: 'Amount Due', cell: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.amount_due ?? row.total_amount)}</span> },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'PDF',
      cell: (row) => (
        <button
          onClick={() => generateInvoicePDF(row, row.customerName)}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md"
        >
          <Printer className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Customer Self-Service Portal</h2>
        <p className="text-xs text-slate-500 mt-1">View your past sales orders, customer invoices & payment history</p>
      </div>

      <Table columns={columns} data={customerInvoices} />
    </div>
  );
};
