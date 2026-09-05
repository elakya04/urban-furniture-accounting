import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Receipt, Printer, CreditCard, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { generateInvoicePDF } from '../../utils/pdfExporter';
import { createRazorpayOrder, openRazorpayCheckout, verifyRazorpayPayment } from '../../services/paymentService';

export const CustomerPortal = () => {
  const { invoices, showToast } = useApp();
  const { currentUser } = useAuth();
  const [processingInvoiceId, setProcessingInvoiceId] = useState(null);
  const [localInvoices, setLocalInvoices] = useState(null);
  const [paidInvoiceIds, setPaidInvoiceIds] = useState(new Set());
  const isPayingRef = useRef(false);

  // Use local invoices if updated via Razorpay, otherwise fallback to context invoices
  const activeInvoicesList = localInvoices || invoices;

  // Filter invoices for active customer
  const customerInvoices = activeInvoicesList.filter(inv => {
    if (!inv) return false;
    if (currentUser?.role === 'CONTACT') {
      const cName = inv.customerName || (typeof inv.customer === 'object' ? inv.customer?.name : null);
      if (cName && currentUser?.name) {
        return cName.toLowerCase().includes(currentUser.name.toLowerCase());
      }
      return true;
    }
    return true;
  });

  const handleCustomerPay = async (inv) => {
    if (isPayingRef.current) return;

    const amountToPay = inv.amount_due ?? inv.total_amount;
    if (!amountToPay || amountToPay <= 0) {
      showToast?.('Invoice has no pending amount', 'info');
      return;
    }

    isPayingRef.current = true;
    setProcessingInvoiceId(inv._id);

    try {
      // Step 1: Create Razorpay order on backend
      const orderData = await createRazorpayOrder({
        amount: amountToPay,
        invoiceId: inv._id,
        inv_number: inv.inv_number,
        customerName: inv.customerName
      });

      // Step 2: Open Razorpay checkout popup
      const paymentResponse = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        invoiceNumber: inv.inv_number,
        customerName: inv.customerName,
        user: {
          name: currentUser?.name || inv.customerName,
          email: currentUser?.email || '',
          phone: currentUser?.mobile || ''
        }
      });

      // Step 3: Verify HMAC signature on backend & settle invoice
      await verifyRazorpayPayment({
        razorpay_order_id: paymentResponse.razorpay_order_id,
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        razorpay_signature: paymentResponse.razorpay_signature,
        invoiceId: inv._id,
        amount: amountToPay
      });

      // Step 4: Show success confirmation & update local table state
      showToast?.(`Payment of ${formatCurrency(amountToPay)} verified successfully! Invoice marked as Paid.`, 'success');

      setPaidInvoiceIds(prev => {
        const next = new Set(prev);
        if (inv._id) next.add(String(inv._id));
        if (inv.inv_number) next.add(inv.inv_number);
        return next;
      });

      setLocalInvoices(prev => {
        const base = prev || invoices;
        return base.map(item => {
          const isMatch = (item._id && inv._id && String(item._id) === String(inv._id)) ||
                          (item.inv_number && inv.inv_number && item.inv_number === inv.inv_number);
          if (isMatch) {
            return {
              ...item,
              amount_paid: (item.amount_paid || 0) + amountToPay,
              amount_due: 0,
              status: 'PAID'
            };
          }
          return item;
        });
      });

    } catch (error) {
      console.error('[RAZORPAY CHECKOUT ERROR]:', error);
      if (error.message !== 'Payment cancelled by user') {
        showToast?.(error.message || 'Payment processing failed', 'error');
      } else {
        showToast?.('Payment cancelled by user', 'info');
      }
    } finally {
      isPayingRef.current = false;
      setProcessingInvoiceId(null);
    }
  };

  const columns = [
    {
      header: 'Invoice No',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800">{row.inv_number}</span>
        </div>
      )
    },
    { header: 'Invoice Date', cell: (row) => formatDate(row.invoice_date) },
    { header: 'Due Date', cell: (row) => formatDate(row.due_date) },
    { header: 'Total Amount', cell: (row) => formatCurrency(row.total_amount) },
    {
      header: 'Amount Due',
      cell: (row) => {
        const isPaid = row.status === 'PAID' || 
                       (row.amount_due !== undefined && row.amount_due <= 0) ||
                       paidInvoiceIds.has(String(row._id)) ||
                       paidInvoiceIds.has(row.inv_number);
        return <span className="font-bold text-slate-900">{formatCurrency(isPaid ? 0 : (row.amount_due ?? row.total_amount))}</span>;
      }
    },
    {
      header: 'Status',
      cell: (row) => {
        const isPaid = row.status === 'PAID' || 
                       (row.amount_due !== undefined && row.amount_due <= 0) ||
                       paidInvoiceIds.has(String(row._id)) ||
                       paidInvoiceIds.has(row.inv_number);
        return <Badge status={isPaid ? 'PAID' : row.status} />;
      }
    },
    {
      header: 'Action / Pay',
      cell: (row) => {
        const isPaid = row.status === 'PAID' || 
                       (row.amount_due !== undefined && row.amount_due <= 0) ||
                       paidInvoiceIds.has(String(row._id)) ||
                       paidInvoiceIds.has(row.inv_number);
        if (isPaid) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Paid
            </span>
          );
        }

        const isProcessing = processingInvoiceId === row._id;
        return (
          <button
            onClick={() => handleCustomerPay(row)}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            {isProcessing ? 'Processing...' : 'Pay with Razorpay'}
          </button>
        );
      }
    },
    {
      header: 'PDF',
      cell: (row) => (
        <button
          onClick={() => generateInvoicePDF(row, row.customerName)}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
          title="Download PDF"
        >
          <Printer className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Customer Self-Service Portal</h2>
        <p className="text-xs text-slate-500 mt-1">View your past sales orders, customer invoices & settle payments online via Razorpay</p>
      </div>

      <Table columns={columns} data={customerInvoices} />
    </div>
  );
};
