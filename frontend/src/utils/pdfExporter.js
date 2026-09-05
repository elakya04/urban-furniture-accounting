import { jsPDF } from 'jspdf';
import { formatCurrency, formatDate } from './formatters';

export const generateInvoicePDF = (invoice, customerName, salesOrderRef) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('URBAN FURNITURE ACCOUNTING', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('TAX INVOICE', 14, 27);

  // Invoice Meta
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Invoice No: ${invoice.inv_number || invoice._id}`, 140, 20);
  doc.text(`Date: ${formatDate(invoice.invoice_date || invoice.createdAt)}`, 140, 26);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 140, 32);
  doc.text(`Status: ${(invoice.status || 'DUE').toUpperCase()}`, 140, 38);

  // Customer Details
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 45, 196, 45);

  doc.setFontSize(11);
  doc.text('Billed To:', 14, 54);
  doc.setFontSize(10);
  doc.text(customerName || 'Valued Customer', 14, 60);
  if (salesOrderRef) {
    doc.text(`Sales Order Ref: ${salesOrderRef}`, 14, 66);
  }

  // Items Table Header
  let startY = 78;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 8, 'F');

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Item / Product', 18, startY + 5.5);
  doc.text('Qty', 110, startY + 5.5);
  doc.text('Unit Price', 135, startY + 5.5);
  doc.text('Total', 170, startY + 5.5);

  let currentY = startY + 14;
  const items = invoice.items || invoice.sales?.items || [
    { product: { productName: 'Standard Furniture Item' }, quantity: 1, unitPrice: invoice.total_amount, total: invoice.total_amount }
  ];

  doc.setTextColor(30, 41, 59);
  items.forEach((item) => {
    const prodName = typeof item.product === 'object' ? item.product?.productName : 'Furniture Item';
    doc.text(String(prodName).substring(0, 40), 18, currentY);
    doc.text(String(item.quantity || 1), 110, currentY);
    doc.text(formatCurrency(item.unitPrice || item.total), 135, currentY);
    doc.text(formatCurrency(item.total), 170, currentY);
    currentY += 8;
  });

  doc.line(14, currentY + 2, 196, currentY + 2);

  // Summary Totals
  currentY += 10;
  doc.setFontSize(10);
  doc.text(`Total Amount: ${formatCurrency(invoice.total_amount)}`, 130, currentY);
  currentY += 6;
  doc.text(`Amount Paid: ${formatCurrency(invoice.amount_paid || 0)}`, 130, currentY);
  currentY += 6;
  doc.setFontSize(11);
  doc.text(`Balance Due: ${formatCurrency(invoice.amount_due ?? invoice.total_amount)}`, 130, currentY);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for choosing Urban Furniture. Humanic Accounting Engine.', 14, 280);

  doc.save(`Invoice_${invoice.inv_number || 'INV'}.pdf`);
};

export const generateReportPDF = (title, reportData) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('URBAN FURNITURE ACCOUNTING', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text(title.toUpperCase(), 14, 30);
  doc.setFontSize(9);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 36);

  doc.line(14, 40, 196, 40);

  let currentY = 50;

  if (Array.isArray(reportData)) {
    reportData.forEach((row) => {
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(String(row.label || row.name), 14, currentY);
      doc.text(formatCurrency(row.value || row.amount || 0), 160, currentY);
      currentY += 8;
    });
  } else if (typeof reportData === 'object') {
    Object.entries(reportData).forEach(([key, val]) => {
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(key, 14, currentY);
      doc.text(typeof val === 'number' ? formatCurrency(val) : String(val), 160, currentY);
      currentY += 8;
    });
  }

  doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
};
