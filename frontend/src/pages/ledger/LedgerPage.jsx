import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { BookOpen, Filter } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const LedgerPage = () => {
  const { coa, journalEntries } = useApp();
  const [selectedAccId, setSelectedAccId] = useState('ALL');

  // Extract all ledger lines from posted journal entries
  const allLedgerLines = [];
  journalEntries.forEach(je => {
    if (je.status === 'POSTED') {
      je.journalItems.forEach(item => {
        allLedgerLines.push({
          jeNumber: je.number,
          date: je.date,
          account: item.account,
          accountName: item.accountName || coa.find(c => c._id === item.account)?.accountName || 'Account',
          partner: item.partner || je.partnerName,
          debit: item.debit || 0,
          credit: item.credit || 0
        });
      });
    }
  });

  const filteredLines = selectedAccId === 'ALL'
    ? allLedgerLines
    : allLedgerLines.filter(line => line.account === selectedAccId);

  let runningBalance = 0;
  const ledgerWithBalance = filteredLines.map(line => {
    runningBalance += (line.debit - line.credit);
    return { ...line, balance: runningBalance };
  });

  const columns = [
    { header: 'Date', cell: (row) => formatDate(row.date) },
    { header: 'Entry Ref', cell: (row) => <span className="font-semibold text-slate-800">{row.jeNumber}</span> },
    { header: 'Account Name', accessor: 'accountName' },
    { header: 'Partner', accessor: 'partner' },
    { header: 'Debit (Rs.)', cell: (row) => row.debit ? <span className="font-medium text-slate-900">{formatCurrency(row.debit)}</span> : '-' },
    { header: 'Credit (Rs.)', cell: (row) => row.credit ? <span className="font-medium text-slate-900">{formatCurrency(row.credit)}</span> : '-' },
    {
      header: 'Net Balance',
      cell: (row) => (
        <span className={`font-bold ${row.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {formatCurrency(row.balance)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">General Ledger Statement</h2>
          <p className="text-xs text-slate-500 mt-1">Complete audit log of all account balances and debit/credit movements</p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAccId}
            onChange={(e) => setSelectedAccId(e.target.value)}
            className="border border-slate-200 bg-slate-50 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
          >
            <option value="ALL">All General Ledger Accounts</option>
            {coa.map(c => (
              <option key={c._id} value={c._id}>{c.accountName} ({c.type})</option>
            ))}
          </select>
        </div>
      </div>

      <Table columns={columns} data={ledgerWithBalance} />
    </div>
  );
};
