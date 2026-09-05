import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { FileText, CreditCard, Printer, Mail, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfExporter';

export const VendorBillsPage = () => {
  const { vendorBills, confirmVendorBill, processPayment, showToast } = useApp();
  const [selectedBill, setSelectedBill] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const [payFormData, setPayFormData] = useState({
    payment_method: 'CASH',
    amount: 0,
    note: 'Vendor bill paid via Cash'
  });

  const handlePayClick = (bill) => {
    setSelectedBill(bill);
    setPayFormData({
      payment_method: 'CASH',
      amount: bill.amount_due ?? bill.total,
      note: `Vendor Bill payment for ${bill.bill_number}`
    });
    setIsPayModalOpen(true);
  };

  const handleProcessPay = (e) => {
    e.preventDefault();
    if (!selectedBill || payFormData.amount <= 0) return;

    processPayment({
      vendorbill: selectedBill._id,
      partnerName: selectedBill.vendorName,
      payment_method: payFormData.payment_method,
      amount: Number(payFormData.amount),
      type: 'SEND',
      note: payFormData.note
    });

    setIsPayModalOpen(false);
  };

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
    { header: 'Bill Reference', accessor: 'bill_reference' },
    { header: 'Vendor Name', accessor: 'vendorName' },
    { header: 'Bill Date', cell: (row) => formatDate(row.bill_date) },
    { header: 'Due Date', cell: (row) => formatDate(row.due_date) },
    { header: 'Total', cell: (row) => formatCurrency(row.total) },
    { header: 'Amount Due', cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.amount_due ?? row.total)}</span> },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'DRAFT' && (
            <button
              onClick={() => confirmVendorBill(row._id)}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Post Bill
            </button>
          )}

          {(row.status === 'DUE' || row.status === 'OVERDUE') && (
            <button
              onClick={() => handlePayClick(row)}
              className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" /> Pay
            </button>
          )}

          <button
            onClick={() => generateInvoicePDF(row, row.vendorName)}
            title="Download PDF Bill"
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vendor Bills</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Supplier Bills, Automatic Purchase Journal Posting & Vendor Payments</p>
        </div>
      </div>

      <Table columns={columns} data={vendorBills} onRowClick={(row) => setSelectedBill(row)} />

      {/* Vendor Bill Form View Modal */}
      <Modal isOpen={Boolean(selectedBill) && !isPayModalOpen} onClose={() => setSelectedBill(null)} title={`Form View: Vendor Bill ${selectedBill?.bill_number || ''}`} maxWidth="max-w-4xl">
        {selectedBill && (
          <div className="space-y-6">
            {/* Action Bar & Stage Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                {selectedBill.status === 'DRAFT' && (
                  <button
                    onClick={() => { confirmVendorBill(selectedBill._id); setSelectedBill(null); }}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Confirm & Post Purchase Journal Entry
                  </button>
                )}
                {(selectedBill.status === 'DUE' || selectedBill.status === 'OVERDUE') && (
                  <button
                    onClick={() => handlePayClick(selectedBill)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Vendor Bill
                  </button>
                )}

                <button
                  onClick={() => generateInvoicePDF(selectedBill, selectedBill.vendorName)}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> Print PDF
                </button>
                <button
                  onClick={() => showToast(`Vendor Bill ${selectedBill.bill_number} sent via email prompt`, 'info')}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                >
                  <Mail className="w-4 h-4 text-slate-500" /> Send Email
                </button>
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-1 text-xs font-semibold">
                {['DRAFT', 'DUE', 'PAID'].map((st, idx) => (
                  <React.Fragment key={st}>
                    <span className={`px-2.5 py-1 rounded-md ${selectedBill.status === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200/60 text-slate-500'}`}>
                      {st}
                    </span>
                    {idx < 2 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Bill Header Details */}
            <div className="grid grid-cols-3 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Vendor Bill Number:</span>
                <div className="text-base font-bold text-slate-900">{selectedBill.bill_number}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Bill Reference:</span>
                <div className="text-base font-bold text-slate-800">{selectedBill.bill_reference || 'ABC-26-001'}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Vendor Name:</span>
                <div className="text-base font-bold text-slate-800">{selectedBill.vendorName}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">PO Reference:</span>
                <div className="font-semibold text-sky-600">{selectedBill.sales || 'P00001'}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Bill Date:</span>
                <div className="font-semibold text-slate-700">{formatDate(selectedBill.bill_date)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Default Chart of Account:</span>
                <div className="font-semibold text-rose-700">Purchase Expense A/c</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Bill Line Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="p-2.5">Sr. No.</th>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5">Chart of Account</th>
                      <th className="p-2.5">Budget Analytics</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedBill.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400">{idx + 1}.</td>
                        <td className="p-2.5 font-semibold text-slate-800">{item.productName || item.product}</td>
                        <td className="p-2.5 text-slate-600">{item.accountName || 'Purchase Expense A/c'}</td>
                        <td className="p-2.5 text-slate-600">{item.budgetAnalyticsName || item.budgetAnalytics || 'Furniture'}</td>
                        <td className="p-2.5 text-center font-medium">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bill Footer Math */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedBill.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium text-emerald-700">{formatCurrency(selectedBill.amount_paid || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Amount Due:</span>
                <span className="text-rose-700">{formatCurrency(selectedBill.amount_due ?? selectedBill.total)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Bill Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Bill Payment: ${selectedBill?.bill_number || ''}`}>
        {selectedBill && (
          <form onSubmit={handleProcessPay} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor Name:</span>
                <span className="font-bold text-slate-800">{selectedBill.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bill Reference:</span>
                <span className="font-medium text-slate-800">{selectedBill.bill_reference || 'Ref Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Bill Amount:</span>
                <span className="font-medium text-slate-800">{formatCurrency(selectedBill.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedBill.amount_due ?? selectedBill.total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Method</label>
              <select
                value={payFormData.payment_method}
                onChange={(e) => setPayFormData({ ...payFormData, payment_method: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-semibold"
              >
                <option value="CASH">Paid Via Cash</option>
                <option value="BANK">Paid Via Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount to Pay (Rs.)</label>
              <input
                type="number"
                required
                min="1"
                max={selectedBill.amount_due ?? selectedBill.total}
                value={payFormData.amount}
                onChange={(e) => setPayFormData({ ...payFormData, amount: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Note / Reference</label>
              <input
                type="text"
                value={payFormData.note}
                onChange={(e) => setPayFormData({ ...payFormData, note: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
