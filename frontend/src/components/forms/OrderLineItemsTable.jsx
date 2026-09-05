import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export const OrderLineItemsTable = ({ items, onChange, isPurchase = false }) => {
  const { products, coa, analyticAccounts } = useApp();

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Auto update prices & calculations
    if (field === 'product') {
      const selectedProd = products.find(p => p._id === value);
      if (selectedProd) {
        item.productName = selectedProd.productName;
        item.unitPrice = isPurchase ? selectedProd.cost : selectedProd.salesPrice;
      }
    }

    if (field === 'quantity' || field === 'unitPrice' || field === 'product') {
      const qty = Number(item.quantity || 1);
      const price = Number(item.unitPrice || 0);
      item.total = qty * price;
    }

    updated[index] = item;
    onChange(updated);
  };

  const addItem = () => {
    const defaultProd = products[0];
    const defaultCOA = isPurchase 
      ? coa.find(c => c.accountName.includes('Purchase'))?._id || coa[0]?._id
      : coa.find(c => c.accountName.includes('Sales'))?._id || coa[0]?._id;
    const defaultAnalytic = analyticAccounts[0]?._id;

    onChange([
      ...items,
      {
        product: defaultProd?._id || '',
        productName: defaultProd?.productName || '',
        account: defaultCOA || '',
        budgetAnalytics: defaultAnalytic || '',
        quantity: 1,
        unitPrice: defaultProd ? (isPurchase ? defaultProd.cost : defaultProd.salesPrice) : 0,
        total: defaultProd ? (isPurchase ? defaultProd.cost : defaultProd.salesPrice) : 0
      }
    ]);
  };

  const removeItem = (index) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, idx) => idx !== index));
  };

  const grandTotal = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
            <tr>
              <th className="px-3 py-2.5">Product</th>
              <th className="px-3 py-2.5">Chart of Account</th>
              <th className="px-3 py-2.5">Budget Analytics</th>
              <th className="px-3 py-2.5 w-20">Qty</th>
              <th className="px-3 py-2.5 w-28">Unit Price</th>
              <th className="px-3 py-2.5 w-28 text-right">Total</th>
              <th className="px-3 py-2.5 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50">
                {/* Product Select */}
                <td className="px-3 py-2">
                  <select
                    value={item.product}
                    onChange={(e) => handleItemChange(index, 'product', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.productName} ({formatCurrency(isPurchase ? p.cost : p.salesPrice)})
                      </option>
                    ))}
                  </select>
                </td>

                {/* Account Select */}
                <td className="px-3 py-2">
                  <select
                    value={item.account}
                    onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {coa.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.accountName} ({c.type})
                      </option>
                    ))}
                  </select>
                </td>

                {/* Budget Analytics Select */}
                <td className="px-3 py-2">
                  <select
                    value={item.budgetAnalytics}
                    onChange={(e) => handleItemChange(index, 'budgetAnalytics', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    {analyticAccounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({a.type})
                      </option>
                    ))}
                  </select>
                </td>

                {/* Qty */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </td>

                {/* Unit Price */}
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </td>

                {/* Subtotal */}
                <td className="px-3 py-2 text-right font-medium text-slate-900">
                  {formatCurrency(item.total)}
                </td>

                {/* Delete line */}
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length <= 1}
                    className="text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Line Item
        </button>

        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase font-semibold mr-2">Grand Total:</span>
          <span className="text-base font-bold text-slate-900">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
};
