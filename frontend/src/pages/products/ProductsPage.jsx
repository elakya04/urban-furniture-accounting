import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ViewToggle } from '../../components/common/ViewToggle';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Plus, Archive, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400';

export const ProductsPage = () => {
  const { products, addProduct, archiveProduct, updateProductInState, showToast } = useApp();
  const [view, setView] = useState('list'); // list or kanban
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    productName: '',
    type: 'GOODS',
    salesPrice: '',
    cost: '',
    category: 'Furniture',
    stockQuantity: '10',
    productImage: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.salesPrice) return;

    setIsSubmitting(true);
    try {
      const payload = {
        productName: formData.productName,
        type: formData.type,
        salesPrice: Number(formData.salesPrice),
        cost: Number(formData.cost || 0),
        category: formData.category || 'General',
        stockQuantity: Number(formData.stockQuantity || 0),
        productImage: formData.productImage || DEFAULT_IMAGE
      };

      const created = await addProduct(payload);

      // If user provided a file, upload to Cloudinary via backend endpoint
      if (imageFile && created?._id) {
        try {
          const uploadData = new FormData();
          uploadData.append('image', imageFile);
          const uploadRes = await api.uploadProductImage(created._id, uploadData);
          if (uploadRes?.data?.productImage) {
            updateProductInState({ ...created, productImage: uploadRes.data.productImage });
            showToast('Product image uploaded successfully', 'success');
          }
        } catch (uploadErr) {
          console.warn('[PRODUCTS] Image upload error:', uploadErr.message);
          showToast('Product created, but image upload failed', 'warning');
        }
      }

      setIsAddModalOpen(false);
      setFormData({
        productName: '',
        type: 'GOODS',
        salesPrice: '',
        cost: '',
        category: 'Furniture',
        stockQuantity: '10',
        productImage: ''
      });
      setImageFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Product Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.productImage || row.imageUrl || DEFAULT_IMAGE}
            alt={row.productName}
            className="w-10 h-10 rounded-lg object-cover border border-slate-200"
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
          />
          <div>
            <div className="font-semibold text-slate-800">{row.productName}</div>
            <div className="text-xs text-slate-400">{row.category || 'General'} • {row.type}</div>
          </div>
        </div>
      )
    },
    { header: 'Sales Price', cell: (row) => formatCurrency(row.salesPrice) },
    { header: 'Cost', cell: (row) => formatCurrency(row.cost) },
    { header: 'Stock Qty', cell: (row) => <span className="font-semibold">{row.stockQuantity ?? 0} units</span> },
    {
      header: 'Status',
      cell: (row) => (
        <button
          onClick={() => archiveProduct(row._id)}
          title="Click to toggle status"
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Badge status={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
        </button>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <button
          onClick={() => archiveProduct(row._id)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border transition-colors ${
            row.isActive
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
          }`}
          title={row.isActive ? 'Archive Product' : 'Activate Product'}
        >
          <Archive className="w-3 h-3" />
          {row.isActive ? 'Archive' : 'Restore'}
        </button>
      )
    }
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
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 mb-3 border border-slate-200 relative group">
                  <img
                    src={prod.productImage || prod.imageUrl || DEFAULT_IMAGE}
                    alt={prod.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                  />
                  <button
                    onClick={() => archiveProduct(prod._id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-slate-600"
                    title={prod.isActive ? 'Archive' : 'Restore'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-sm">{prod.productName}</h3>
                  <Badge status={prod.type} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">{prod.category || 'General'}</p>
                  <Badge status={prod.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
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
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              placeholder="e.g. Ergonomic Office Chair / Cloud Accounting"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
                placeholder="Furniture / Services / Tech"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Sales Price (Rs.) *</label>
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

          {/* Image file or URL */}
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <label className="block text-xs font-semibold uppercase text-slate-500">Product Image</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Upload File (Cloudinary)</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-2 text-xs hover:bg-slate-50 transition cursor-pointer">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-100 file:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Or Image URL</label>
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-2.5 py-2 text-xs">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={formData.productImage}
                    onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                    placeholder="https://..."
                    className="w-full text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
