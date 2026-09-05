import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Card } from '../../components/common/Card';
import { Archive, Plus, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const StockPage = () => {
  const { products, adjustStock } = useApp();
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?._id || '');
  const [adjQty, setAdjQty] = useState('5');
  const [reason, setReason] = useState('Physical Audit Count Adjustment');

  const handleAdjSubmit = (e) => {
    e.preventDefault();
    if (!selectedProductId || !adjQty) return;
    adjustStock(selectedProductId, Number(adjQty), reason);
    setIsAdjModalOpen(false);
  };

  const columns = [
    {
      header: 'Product',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
          <div>
            <div className="font-semibold text-slate-800">{row.productName}</div>
            <div className="text-xs text-slate-400">{row.category}</div>
          </div>
        </div>
      )
    },
    { header: 'Current Stock Qty', cell: (row) => <span className="font-bold text-slate-900">{row.stockQuantity} units</span> },
    { header: 'Unit Cost', cell: (row) => formatCurrency(row.cost) },
    { header: 'Total Stock Value', cell: (row) => <span className="font-semibold text-emerald-700">{formatCurrency(row.cost * row.stockQuantity)}</span> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Stock & Warehouse Inventory</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time product quantities, inventory valuation & manual stock adjustments</p>
        </div>
        <button
          onClick={() => setIsAdjModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4" />
          Stock Adjustment
        </button>
      </div>

      <Table columns={columns} data={products} />

      <Modal isOpen={isAdjModalOpen} onClose={() => setIsAdjModalOpen(false)} title="Record Stock Adjustment">
        <form onSubmit={handleAdjSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Select Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            >
              {products.map(p => (
                <option key={p._id} value={p._id}>{p.productName} (Current: {p.stockQuantity} units)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Adjustment Quantity (+ or -)</label>
            <input
              type="number"
              required
              value={adjQty}
              onChange={(e) => setAdjQty(e.target.value)}
              placeholder="e.g. +5 or -2"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Adjustment Reason</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
