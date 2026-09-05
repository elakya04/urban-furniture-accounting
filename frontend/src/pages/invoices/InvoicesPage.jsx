import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Receipt, CheckCircle, CreditCard, Printer, Mail, FileText, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfExporter';
import { api } from '../../services/api';

export const InvoicesPage = () => {
  const { invoices, confirmInvoice, cancelInvoice, processPayment, showToast } = useApp();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const [payFormData, setPayFormData] = useState({
    payment_method: 'BANK',
    amount: 0,
    note: 'Payment received via Bank'
  });

  const handlePrintPDF = async (inv) => {
    try {
      console.log('[LOKI AUDIT LOG] Fetching Invoice PDF payload from backend for:', inv.inv_number);
      const pdfMeta = await api.getInvoicePDF(inv._id);
      generateInvoicePDF(pdfMeta || inv, inv.customerName);
    } catch (err) {
      console.warn('[LOKI AUDIT LOG] PDF API fallback:', err.message);
      generateInvoicePDF(inv, inv.customerName);
    }
  };

  const handlePayClick = async (inv) => {
    setSelectedInvoice(inv);
    try {
      console.log('[LOKI AUDIT LOG] Querying backend payments for invoice:', inv.inv_number);
      await api.getInvoicePayments(inv._id);
    } catch (err) {
      console.warn('[LOKI AUDIT LOG] Payments lookup error:', err.message);
    }

    setPayFormData({
      payment_method: 'BANK',
      amount: inv.amount_due ?? inv.total_amount,
      note: `Payment received for ${inv.inv_number}`
    });
    setIsPayModalOpen(true);
  };

  const handleProcessPay = (e) => {
    e.preventDefault();
    if (!selectedInvoice || payFormData.amount <= 0) return;

    processPayment({
      invoiceBill: selectedInvoice._id,
      partnerName: selectedInvoice.customerName,
      payment_method: payFormData.payment_method,
      amount: Number(payFormData.amount),
      type: 'RECEIVE',
      note: payFormData.note
    });

    setIsPayModalOpen(false);
  };

  const columns = [
    {
      header: 'Invoice Number',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">{row.inv_number}</span>
        </div>
      )
    },
    { header: 'Customer', accessor: 'customerName' },
    { header: 'Invoice Date', cell: (row) => formatDate(row.invoice_date) },
    { header: 'Due Date', cell: (row) => formatDate(row.due_date) },
    { header: 'Total', cell: (row) => formatCurrency(row.total_amount) },
    { header: 'Amount Due', cell: (row) => <span className="font-semibold text-slate-900">{formatCurrency(row.amount_due ?? row.total_amount)}</span> },
    { header: 'Status', cell: (row) => <Badge status={row.status} /> },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {row.status === 'DRAFT' && (
            <button
              onClick={() => confirmInvoice(row._id)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Post Invoice
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
            onClick={() => handlePrintPDF(row)}
            title="Download PDF Invoice"
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
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Customer Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Invoices, Automatic Sales Journal Posting & Customer Payments</p>
        </div>
      </div>

      <Table columns={columns} data={invoices} onRowClick={(row) => setSelectedInvoice(row)} />

      {/* Invoice Form View Modal */}
      <Modal isOpen={Boolean(selectedInvoice) && !isPayModalOpen} onClose={() => setSelectedInvoice(null)} title={`Form View: Customer Invoice ${selectedInvoice?.inv_number || ''}`} maxWidth="max-w-4xl">
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Action Bar & Stage Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                {selectedInvoice.status === 'DRAFT' && (
                  <button
                    onClick={() => { confirmInvoice(selectedInvoice._id); setSelectedInvoice(null); }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Confirm & Post Journal Entry
                  </button>
                )}
                {(selectedInvoice.status === 'DUE' || selectedInvoice.status === 'OVERDUE') && (
                  <button
                    onClick={() => handlePayClick(selectedInvoice)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" /> Pay Invoice
                  </button>
                )}

                {selectedInvoice.status !== 'CANCEL' && selectedInvoice.status !== 'PAID' && (
                  <button
                    onClick={() => { cancelInvoice(selectedInvoice._id); setSelectedInvoice(null); }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium rounded-lg"
                  >
                    Cancel Invoice
                  </button>
                )}

                <button
                  onClick={() => handlePrintPDF(selectedInvoice)}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                >
                  <Printer className="w-4 h-4 text-slate-500" /> Print PDF
                </button>
                <button
                  onClick={() => showToast(`Invoice ${selectedInvoice.inv_number} sent via email prompt`, 'info')}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                >
                  <Mail className="w-4 h-4 text-slate-500" /> Send Email
                </button>
              </div>

              {/* Status Bar */}
              <div className="flex items-center gap-1 text-xs font-semibold">
                {['DRAFT', 'DUE', 'PAID'].map((st, idx) => (
                  <React.Fragment key={st}>
                    <span className={`px-2.5 py-1 rounded-md ${selectedInvoice.status === st ? 'bg-slate-900 text-white font-bold' : 'bg-slate-200/60 text-slate-500'}`}>
                      {st}
                    </span>
                    {idx < 2 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Invoice Header details */}
            <div className="grid grid-cols-3 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Invoice Number:</span>
                <div className="text-base font-bold text-slate-900">{selectedInvoice.inv_number}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Customer Name:</span>
                <div className="text-base font-bold text-slate-800">{selectedInvoice.customerName}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">SO Reference:</span>
                <div className="font-semibold text-sky-600">{selectedInvoice.sales || 'Direct Invoice'}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Invoice Date:</span>
                <div className="font-semibold text-slate-700">{formatDate(selectedInvoice.invoice_date)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Due Date:</span>
                <div className="font-semibold text-slate-700">{formatDate(selectedInvoice.due_date)}</div>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Default Chart of Account:</span>
                <div className="font-semibold text-emerald-700">Sales Income A/c</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Invoice Line Items</h4>
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
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 text-slate-400">{idx + 1}.</td>
                        <td className="p-2.5 font-semibold text-slate-800">{item.productName || item.product}</td>
                        <td className="p-2.5 text-slate-600">{item.accountName || 'Sales Income A/c'}</td>
                        <td className="p-2.5 text-slate-600">{item.budgetAnalyticsName || item.budgetAnalytics || 'Office Expansion'}</td>
                        <td className="p-2.5 text-center font-medium">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Footer Math */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold text-slate-900">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium text-emerald-700">{formatCurrency(selectedInvoice.amount_paid || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm text-slate-900">
                <span>Amount Due:</span>
                <span className="text-amber-700">{formatCurrency(selectedInvoice.amount_due ?? selectedInvoice.total_amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Payment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Invoice Payment: ${selectedInvoice?.inv_number || ''}`}>
        {selectedInvoice && (
          <form onSubmit={handleProcessPay} className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-800">{selectedInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoice Amount:</span>
                <span className="font-medium text-slate-800">{formatCurrency(selectedInvoice.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due:</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedInvoice.amount_due ?? selectedInvoice.total_amount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Method</label>
              <select
                value={payFormData.payment_method}
                onChange={(e) => setPayFormData({ ...payFormData, payment_method: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-semibold"
              >
                <option value="BANK">Paid Via Bank</option>
                <option value="CASH">Paid Via Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount to Pay (Rs.)</label>
              <input
                type="number"
                required
                min="1"
                max={selectedInvoice.amount_due ?? selectedInvoice.total_amount}
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

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => generateInvoicePDF(selectedInvoice, selectedInvoice.customerName)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" /> Print PDF
              </button>

              <div className="flex gap-2">
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
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
