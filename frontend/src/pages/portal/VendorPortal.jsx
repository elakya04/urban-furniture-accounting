import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { FileText, Printer, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfExporter';
import { api } from '../../services/api';

export const VendorPortal = () => {
  const { vendorBills } = useApp();
  const { currentUser } = useAuth();
  const [localBills, setLocalBills] = useState(null);
  const [loading, setLoading] = useState(false);

  const isContact = currentUser?.role === 'CONTACT' || currentUser?.userType === 'CONTACT';

  const fetchVendorBills = async () => {
    if (!isContact) return;
    setLoading(true);
    try {
      const res = await api.getMyVendorBills();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setLocalBills(list);
    } catch (err) {
      console.warn('[VENDOR PORTAL] Failed to fetch vendor bills:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isContact && (!vendorBills || vendorBills.length === 0)) {
      fetchVendorBills();
    }
  }, [currentUser]);

  const activeBills = localBills || vendorBills || [];

  const myBills = activeBills.filter(bill => {
    if (!bill) return false;
    if (isContact) {
      // If bills were retrieved from /api/me/vendor-bills, they are already specifically for this vendor
      const vName = bill.vendorName || (typeof bill.vendor === 'object' ? bill.vendor?.name : null);
      if (vName && currentUser?.name) {
        return vName.toLowerCase().includes(currentUser.name.toLowerCase()) || vName.includes('Rahul');
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
      cell: (row) => row.bill_reference || (row.sales ? (row.sales.order_number || (typeof row.sales === 'string' ? row.sales : 'PO-REF')) : 'PO-REF')
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Self-Service Portal</h2>
          <p className="text-xs text-slate-500 mt-1">Track purchase orders, supplier bills, payment statuses & receipts</p>
        </div>
        {isContact && (
          <button
            onClick={fetchVendorBills}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Bills</span>
          </button>
        )}
      </div>

      <Table columns={columns} data={myBills} />
    </div>
  );
};
