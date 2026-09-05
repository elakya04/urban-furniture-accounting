import React from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { ShieldCheck } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const AuditLogList = () => {
  const { auditLogs } = useApp();

  const columns = [
    {
      header: 'Action',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <Badge status={row.action} />
        </div>
      )
    },
    { header: 'User', accessor: 'user' },
    { header: 'Audit Details', accessor: 'details' },
    { header: 'Timestamp', cell: (row) => formatDate(row.timestamp) }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Audit Trail</h2>
        <p className="text-xs text-slate-500 mt-1">Immutable log of system actions, invoice postings, budget revisions & user activity</p>
      </div>

      <Table columns={columns} data={auditLogs} />
    </div>
  );
};
