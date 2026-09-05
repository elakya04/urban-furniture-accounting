import React from 'react';

export const Table = ({ columns, data, onRowClick, emptyMessage = 'No records found' }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-sm text-slate-700 border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row._id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors hover:bg-slate-50/80 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
