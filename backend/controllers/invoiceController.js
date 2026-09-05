import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import Payment from "../models/Payment.js";

// Helper function to find Invoice by ObjectId, string _id, or inv_number
async function findInvoiceByIdOrNumber(id) {
  if (!id) return null;
  if (mongoose.isValidObjectId(id)) {
    const inv = await Invoice.findById(id);
    if (inv) return inv;
  }
  return await Invoice.findOne({
    $or: [{ _id: id }, { inv_number: id }]
  });
}

// GET /api/invoices - Fetch all invoices
export async function getInvoices(req, res) {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    return res.status(200).json(invoices);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/invoices/:id - Get single invoice by ID or invoice_number
export async function getInvoiceById(req, res) {
  try {
    const invoice = await findInvoiceByIdOrNumber(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    return res.status(200).json(invoice);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /api/invoices/:id/confirm - Confirm invoice
export async function confirmInvoice(req, res) {
  try {
    const invoice = await findInvoiceByIdOrNumber(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.status = invoice.amount_due === 0 ? "PAID" : "DUE";
    await invoice.save();

    return res.status(200).json({
      message: `Invoice ${invoice.inv_number} confirmed`,
      invoice
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// POST /api/invoices/:id/cancel - Cancel invoice
export async function cancelInvoice(req, res) {
  try {
    const invoice = await findInvoiceByIdOrNumber(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    invoice.status = "CANCEL";
    await invoice.save();

    return res.status(200).json({
      message: `Invoice ${invoice.inv_number} cancelled`,
      invoice
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// GET /api/invoices/:id/payments - Get payments associated with invoice
export async function getInvoicePayments(req, res) {
  try {
    const invoice = await findInvoiceByIdOrNumber(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const payments = await Payment.find({
      $or: [
        { invoiceBill: invoice._id },
        { invoiceBill: invoice.inv_number },
        { invoiceBill: req.params.id }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      invoiceNumber: invoice.inv_number,
      totalAmount: invoice.total_amount,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      payments
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/invoices/:id/pdf - Return structured data formatted for PDF generation
export async function getInvoicePDF(req, res) {
  try {
    const invoice = await findInvoiceByIdOrNumber(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const pdfData = {
      title: `Invoice - ${invoice.inv_number}`,
      inv_number: invoice.inv_number,
      customerName: invoice.customerName,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      total_amount: invoice.total_amount,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      status: invoice.status,
      items: invoice.items || [],
      company: {
        name: "Urban Furniture Ltd.",
        address: "101 Luxury Way, Mumbai, Maharashtra 400001",
        taxId: "GST27URBANFURN1234"
      }
    };

    return res.status(200).json(pdfData);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
