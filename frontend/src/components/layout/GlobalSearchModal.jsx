import React, { useState, useEffect } from 'react';
import { Search, X, ArrowRight, Package, Users, Receipt, ShoppingCart, Truck, PieChart } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalSearchModal = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const { products, contacts, invoices, salesOrders, purchaseOrders, vendorBills, budgets } = useApp();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredProducts = q ? products.filter(p => p.productName.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) : [];
  const filteredContacts = q ? contacts.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : [];
  const filteredInvoices = q ? invoices.filter(i => (i.inv_number || '').toLowerCase().includes(q) || (i.customerName || '').toLowerCase().includes(q)) : [];
  const filteredBills = q ? vendorBills.filter(b => (b.bill_number || '').toLowerCase().includes(q) || (b.vendorName || '').toLowerCase().includes(q)) : [];
  const filteredBudgets = q ? budgets.filter(b => b.name.toLowerCase().includes(q)) : [];

  const hasResults = filteredProducts.length > 0 || filteredContacts.length > 0 || filteredInvoices.length > 0 || filteredBills.length > 0 || filteredBudgets.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Search Bar Input */}
        <div className="flex items-center px-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, invoices, contacts, budgets..."
            className="w-full py-4 text-sm bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {!q && (
            <div className="text-center py-8 text-xs text-slate-400">
              Type to search across all master records, invoices, orders & budgets...
            </div>
          )}

          {q && !hasResults && (
            <div className="text-center py-8 text-xs text-slate-400">
              No matching records found for "{query}".
            </div>
          )}

          {/* Invoices */}
          {filteredInvoices.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Receipt className="w-3 h-3" /> Invoices
              </div>
              <div className="space-y-1">
                {filteredInvoices.map(inv => (
                  <div
                    key={inv._id}
                    onClick={() => { onNavigate('invoices'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{inv.inv_number}</span>
                      <span className="text-slate-400 ml-2">({inv.customerName})</span>
                    </div>
                    <span className="font-medium text-slate-700">Rs. {inv.total_amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3 h-3" /> Products
              </div>
              <div className="space-y-1">
                {filteredProducts.map(p => (
                  <div
                    key={p._id}
                    onClick={() => { onNavigate('products'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{p.productName}</span>
                      <span className="text-slate-400 ml-2">({p.category})</span>
                    </div>
                    <span className="font-medium text-slate-700">Sales Price: Rs. {p.salesPrice?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contacts */}
          {filteredContacts.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Contacts
              </div>
              <div className="space-y-1">
                {filteredContacts.map(c => (
                  <div
                    key={c._id}
                    onClick={() => { onNavigate('contacts'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      <span className="text-slate-400 ml-2">({c.userType})</span>
                    </div>
                    <span className="text-slate-500">{c.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budgets */}
          {filteredBudgets.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                <PieChart className="w-3 h-3" /> Budgets
              </div>
              <div className="space-y-1">
                {filteredBudgets.map(b => (
                  <div
                    key={b._id}
                    onClick={() => { onNavigate('budgets'); onClose(); }}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{b.name}</span>
                      <span className="text-slate-400 ml-2">({b.status})</span>
                    </div>
                    <span className="font-medium text-slate-700">Committed: Rs. {b.committed_amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
