import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/**
 * Enhanced Table component with dedicated per-page search, pagination, and interactive column sorting.
 */
export const Table = ({
  columns,
  data = [],
  onRowClick,
  emptyMessage = 'No records found',
  searchable = true,
  searchPlaceholder = 'Search records in this page...',
  paginated = true,
  defaultPageSize = 10,
  sortable = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortConfig, setSortConfig] = useState({ columnIndex: null, direction: null });

  // Helper to recursively search through values of a row object
  const matchesSearch = (obj, query) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();

    return Object.values(obj || {}).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'object') {
        if (Array.isArray(val)) {
          return val.some((item) => matchesSearch(item, lowerQuery));
        }
        return matchesSearch(val, lowerQuery);
      }
      return String(val).toLowerCase().includes(lowerQuery);
    });
  };

  // Filtered dataset based on dedicated search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    return data.filter((row) => matchesSearch(row, searchQuery.trim()));
  }, [data, searchQuery]);

  // Extract sortable value from row
  const getSortableValue = (row, col) => {
    if (col.sortVal) return col.sortVal(row);
    if (col.accessor) {
      const val = row[col.accessor];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        // Handle currency or formatted numbers e.g. "Rs. 25,000"
        const num = parseFloat(val.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(num) && val.match(/\d/)) return num;
        return val.toLowerCase();
      }
      return val;
    }
    // Fallback: inspect raw object values
    return String(row[col.header] || '').toLowerCase();
  };

  // Sorted dataset based on active sort column and direction
  const sortedData = useMemo(() => {
    if (!sortable || sortConfig.columnIndex === null || !sortConfig.direction) {
      return filteredData;
    }

    const col = columns[sortConfig.columnIndex];
    if (!col) return filteredData;

    const dirMult = sortConfig.direction === 'asc' ? 1 : -1;

    return [...filteredData].sort((a, b) => {
      const valA = getSortableValue(a, col);
      const valB = getSortableValue(b, col);

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dirMult;
      }
      return String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' }) * dirMult;
    });
  }, [filteredData, sortConfig, columns, sortable]);

  // Helper to determine if a column is eligible for sorting
  const isColumnSortable = (col) => {
    if (!sortable) return false;
    if (col.sortable === false) return false;
    if (col.sortable === true) return true;
    const headerLower = String(col.header || '').toLowerCase();
    if (headerLower === 'actions' || headerLower === 'action' || headerLower === '') return false;
    return Boolean(col.accessor || col.sortKey || col.sortVal);
  };

  // Handle column header click to cycle sort: asc -> desc -> reset
  const handleSort = (colIdx) => {
    const col = columns[colIdx];
    if (!col || !isColumnSortable(col)) return;

    setSortConfig((prev) => {
      if (prev.columnIndex === colIdx) {
        if (prev.direction === 'asc') return { columnIndex: colIdx, direction: 'desc' };
        if (prev.direction === 'desc') return { columnIndex: null, direction: null };
      }
      return { columnIndex: colIdx, direction: 'asc' };
    });
  };

  // Reset to page 1 whenever search query changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Calculate pagination bounds
  const totalItems = sortedData.length;
  const totalPages = paginated ? Math.ceil(totalItems / pageSize) || 1 : 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const displayedData = useMemo(() => {
    if (!paginated) return sortedData;
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, paginated, validCurrentPage, pageSize]);

  const startEntry = totalItems === 0 ? 0 : (validCurrentPage - 1) * pageSize + 1;
  const endEntry = Math.min(validCurrentPage * pageSize, totalItems);

  return (
    <div className="space-y-4">
      {/* ── Dedicated Search Bar & Page Controls Bar ── */}
      {searchable && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          {/* Dedicated Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-10 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Count Badge & Active Sort Indicator */}
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            {sortConfig.columnIndex !== null && sortConfig.direction && (
              <button
                onClick={() => setSortConfig({ columnIndex: null, direction: null })}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                title="Reset column sorting"
              >
                Sorted by: {columns[sortConfig.columnIndex]?.header} ({sortConfig.direction.toUpperCase()})
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
            {searchQuery.trim() ? (
              <span>
                Found <strong className="text-slate-800">{totalItems}</strong> matching record{totalItems !== 1 ? 's' : ''}
              </span>
            ) : (
              <span>
                Total Records: <strong className="text-slate-800">{data.length}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Table Content ── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700 border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              {columns.map((col, idx) => {
                const canSort = isColumnSortable(col);
                const isSorted = sortConfig.columnIndex === idx;
                return (
                  <th
                    key={idx}
                    onClick={() => canSort && handleSort(idx)}
                    className={`px-4 py-3.5 transition-colors select-none ${
                      canSort ? 'cursor-pointer hover:bg-slate-100/80' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span>{col.header}</span>
                      {canSort && (
                        <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
                          {isSorted && sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-slate-900 font-bold" />
                          ) : isSorted && sortConfig.direction === 'desc' ? (
                            <ArrowDown className="w-3.5 h-3.5 text-slate-900 font-bold" />
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400 text-sm">
                  {searchQuery ? `No records matching "${searchQuery}"` : emptyMessage}
                </td>
              </tr>
            ) : (
              displayedData.map((row, rowIdx) => (
                <tr
                  key={row._id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors hover:bg-slate-50/80 ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 text-xs ${col.className || ''}`}>
                      {col.cell ? col.cell(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Controls ── */}
      {paginated && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          {/* Entries Indicator */}
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{startEntry}</strong> to{' '}
            <strong className="text-slate-800">{endEntry}</strong> of{' '}
            <strong className="text-slate-800">{totalItems}</strong> entries
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-4">
            {/* Per Page Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - validCurrentPage) <= 1)
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && p - arr[idx - 1] > 1 && (
                      <span className="px-1 text-slate-300 text-xs">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg transition-all ${
                        validCurrentPage === p
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
