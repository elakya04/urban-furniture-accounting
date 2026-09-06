import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { FileText, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfExporter';

export const VendorPortal = () => {
  const { vendorBills } = useApp();
  const { currentUser } = useAuth();

  const myBills = vendorBills.filter(bill => {
    if (!bill) return false;
    if (currentUser?.role === 'CONTACT') {
      const vName = bill.vendorName || (typeof bill.vendor === 'object' ? bill.vendor?.name : null);
      if (vName && currentUser?.name) {
        return vName.toLowerCase().includes(currentUser.name.toLowerCase());
      }
      return true;
    }
    return true;
  });

  const columns = [
    {
      header: 'Vendor Bill No',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-800">{row.bill_number}</span>
        </div>
      )
    },
    {
      header: 'Bill Ref',
      accessor: 'bill_reference',
      cell: (row) => row.bill_reference || (row.sales ? (row.sales.order_number || (typeof row.sales === 'string' ? row.sales : '-')) : '-')
    },
    { header: 'Bill Date', cell: (row) => formatDate(row.bill_date || row.createdAt) },
    { header: 'Total Amount', cell: (row) => formatCurrency(row.total) },
    { header: 'Amount Due', cell: (row) => <span className="font-bold text-slate-900">{formatCurrency(row.amount_due ?? row.total)}</span> },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'PDF',
      cell: (row) => (
        <button
          onClick={() => {
            const vName = row.vendorName || (typeof row.vendor === 'object' ? row.vendor?.name : null) || currentUser?.name || 'Vendor';
            generateInvoicePDF(row, vName);
          }}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
          title="Print / Save PDF"
        >
          <Printer className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Self-Service Portal</h2>
        <p className="text-xs text-slate-500 mt-1">Track purchase orders, supplier bills, payment statuses & receipts</p>
      </div>

      <Table columns={columns} data={myBills} />
    </div>
  );
};
