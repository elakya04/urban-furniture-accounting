import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ViewToggle } from '../../components/common/ViewToggle';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Package, Tag, Archive } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ProductsPage = () => {
  const { products, addProduct } = useApp();
  const [view, setView] = useState('list'); // list or kanban
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    productName: '',
    type: 'GOODS',
    salesPrice: '',
    cost: '',
    category: 'Electronics',
    stockQuantity: '10'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.salesPrice) return;

    addProduct({
      productName: formData.productName,
      type: formData.type,
      salesPrice: Number(formData.salesPrice),
      cost: Number(formData.cost || 0),
      category: formData.category,
      stockQuantity: Number(formData.stockQuantity || 0),
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'
    });

    setIsAddModalOpen(false);
    setFormData({ productName: '', type: 'GOODS', salesPrice: '', cost: '', category: 'Electronics', stockQuantity: '10' });
  };

  const columns = [
    {
      header: 'Product Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
          <div>
            <div className="font-semibold text-slate-800">{row.productName}</div>
            <div className="text-xs text-slate-400">{row.category} • {row.type}</div>
          </div>
        </div>
      )
    },
    { header: 'Sales Price', cell: (row) => formatCurrency(row.salesPrice) },
    { header: 'Cost', cell: (row) => formatCurrency(row.cost) },
    { header: 'Stock Qty', cell: (row) => <span className="font-semibold">{row.stockQuantity} units</span> },
    { header: 'Status', cell: (row) => <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Product Master List</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Goods, Services, Sales Prices, and Cost Accounting</p>
        </div>

        <div className="flex items-center gap-3">
          {/* List vs Kanban View Toggle */}
          <ViewToggle currentView={view} onViewChange={setView} />

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Render List View */}
      {view === 'list' && (
        <Table columns={columns} data={products} />
      )}

      {/* Render Kanban View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(prod => (
            <Card key={prod._id} className="flex flex-col justify-between space-y-4">
              <div>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 mb-3 border border-slate-200">
                  <img src={prod.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">{prod.productName}</h3>
                  <Badge status={prod.type} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{prod.category}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-400">Sales Price</span>
                  <span className="font-bold text-slate-900">{formatCurrency(prod.salesPrice)}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-400">Cost</span>
                  <span className="font-semibold text-slate-600">{formatCurrency(prod.cost)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Product">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g. Air Conditioner / Ergonomic Desk"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="GOODS">GOODS</option>
                <option value="SERVICE">SERVICE</option>
                <option value="COMBO">COMBO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Sales Price (Rs.)</label>
              <input
                type="number"
                required
                min="0"
                value={formData.salesPrice}
                onChange={(e) => setFormData({ ...formData, salesPrice: e.target.value })}
                placeholder="25000"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cost (Rs.)</label>
              <input
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="15000"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Initial Stock</label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
