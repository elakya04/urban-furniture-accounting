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


// GET /api/invoices
export async function getInvoices(req, res) {
  console.log(JSON.stringify({
    level: "info",
    event: "invoices_fetch_request",
    role: req.role,
    user: req.user?.name,
    timestamp: new Date().toISOString()
  }));

  try {
    const filter = {};
    const role = req.role || req.user?.role || req.user?.userType;

    // Strict multi-tenant isolation: Contacts can only see invoices linked to them
    if (role === "CONTACT") {
      const customerName = (req.user?.name || "").trim();
      const loginId = (req.user?.loginId || "").trim();
      const contactId = req.user?._id || req.contactid;

      const orConditions = [];
      if (customerName) {
        const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        orConditions.push({ customerName: { $regex: new RegExp(`^${escapedName}$`, "i") } });
        orConditions.push({ customerName: { $regex: new RegExp(escapedName, "i") } });
      }
      if (loginId) {
        const escapedLogin = loginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        orConditions.push({ customerName: { $regex: new RegExp(escapedLogin, "i") } });
      }
      if (contactId) {
        orConditions.push({ customer: contactId });
      }

      if (orConditions.length > 0) {
        filter.$or = orConditions;
      } else {
        return res.status(200).json([]);
      }
    }

    const invoices = await Invoice.find(filter)
      .populate("sales")
      .sort({ createdAt: -1 });

    console.log(JSON.stringify({
      level: "info",
      event: "invoices_fetched",
      count: invoices.length,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json(invoices);

  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "invoices_fetch_failed",
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      message: err.message
    });
  }
}

// GET /api/me/invoices
export async function getMyInvoices(req, res) {
  try {
    const customerName = (req.user?.name || "").trim();
    const loginId = (req.user?.loginId || "").trim();
    const contactId = req.user?._id || req.contactid;

    const orConditions = [];
    if (customerName) {
      const escapedName = customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push({ customerName: { $regex: new RegExp(`^${escapedName}$`, "i") } });
      orConditions.push({ customerName: { $regex: new RegExp(escapedName, "i") } });
    }
    if (loginId) {
      const escapedLogin = loginId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      orConditions.push({ customerName: { $regex: new RegExp(escapedLogin, "i") } });
    }
    if (contactId) {
      orConditions.push({ customer: contactId });
    }

    const filter = orConditions.length > 0 ? { $or: orConditions } : { _id: null };
    const invoices = await Invoice.find(filter)
      .populate("sales")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: invoices
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer invoices",
      error: err.message
    });
  }
}


// GET /api/invoices/:id
export async function getInvoiceById(req, res) {
  const invoiceId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "invoice_fetch_request",
    invoiceId,
    timestamp: new Date().toISOString()
  }));

  try {
    const invoice = await findInvoiceByIdOrNumber(invoiceId);

    if (!invoice) {
      console.log(JSON.stringify({
        level: "warn",
        event: "invoice_not_found",
        invoiceId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        message: "Invoice not found"
      });
    }

    console.log(JSON.stringify({
      level: "info",
      event: "invoice_fetched",
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.inv_number,
      status: invoice.status,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json(invoice);

  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "invoice_fetch_failed",
      invoiceId,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      message: err.message
    });
  }
}


// POST /api/invoices/:id/confirm
export async function confirmInvoice(req, res) {
  const invoiceId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "invoice_confirm_request",
    invoiceId,
    timestamp: new Date().toISOString()
  }));

  try {
    const invoice = await findInvoiceByIdOrNumber(invoiceId);

    if (!invoice) {
      console.log(JSON.stringify({
        level: "warn",
        event: "invoice_confirm_not_found",
        invoiceId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        message: "Invoice not found"
      });
    }

    const previousStatus = invoice.status;

    invoice.status = invoice.amount_due === 0
      ? "PAID"
      : "DUE";

    await invoice.save();

    console.log(JSON.stringify({
      level: "info",
      event: "invoice_confirmed",
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.inv_number,
      previousStatus,
      newStatus: invoice.status,
      totalAmount: invoice.total_amount,
      amountDue: invoice.amount_due,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      message: `Invoice ${invoice.inv_number} confirmed`,
      invoice
    });

  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "invoice_confirm_failed",
      invoiceId,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(400).json({
      message: err.message
    });
  }
}


// POST /api/invoices/:id/cancel
export async function cancelInvoice(req, res) {
  const invoiceId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "invoice_cancel_request",
    invoiceId,
    timestamp: new Date().toISOString()
  }));

  try {
    const invoice = await findInvoiceByIdOrNumber(invoiceId);

    if (!invoice) {
      console.log(JSON.stringify({
        level: "warn",
        event: "invoice_cancel_not_found",
        invoiceId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        message: "Invoice not found"
      });
    }

    const previousStatus = invoice.status;

    invoice.status = "CANCEL";
    await invoice.save();

    console.log(JSON.stringify({
      level: "info",
      event: "invoice_cancelled",
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.inv_number,
      previousStatus,
      newStatus: invoice.status,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      message: `Invoice ${invoice.inv_number} cancelled`,
      invoice
    });

  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "invoice_cancel_failed",
      invoiceId,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(400).json({
      message: err.message
    });
  }
}


// GET /api/invoices/:id/payments
export async function getInvoicePayments(req, res) {
  const invoiceId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "invoice_payments_fetch_request",
    invoiceId,
    timestamp: new Date().toISOString()
  }));

  try {
    const invoice = await findInvoiceByIdOrNumber(invoiceId);

    if (!invoice) {
      console.log(JSON.stringify({
        level: "warn",
        event: "invoice_payments_invoice_not_found",
        invoiceId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        message: "Invoice not found"
      });
    }

    const payments = await Payment.find({
      $or: [
        { invoiceBill: invoice._id },
        { invoiceBill: invoice.inv_number },
        { invoiceBill: invoiceId }
      ]
    }).sort({ createdAt: -1 });

    console.log(JSON.stringify({
      level: "info",
      event: "invoice_payments_fetched",
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.inv_number,
      paymentCount: payments.length,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json({
      invoiceNumber: invoice.inv_number,
      totalAmount: invoice.total_amount,
      amountPaid: invoice.amount_paid,
      amountDue: invoice.amount_due,
      payments
    });

  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "invoice_payments_fetch_failed",
      invoiceId,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      message: err.message
    });
  }
}


// GET /api/invoices/:id/pdf
export async function getInvoicePDF(req, res) {
  const invoiceId = req.params.id;

  console.log(JSON.stringify({
    level: "info",
    event: "invoice_pdf_request",
    invoiceId,
    timestamp: new Date().toISOString()
  }));

  try {
    const invoice = await findInvoiceByIdOrNumber(invoiceId);

    if (!invoice) {
      console.log(JSON.stringify({
        level: "warn",
        event: "invoice_pdf_not_found",
        invoiceId,
        timestamp: new Date().toISOString()
      }));

      return res.status(404).json({
        message: "Invoice not found"
      });
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

    console.log(JSON.stringify({
      level: "info",
      event: "invoice_pdf_data_generated",
      invoiceId: invoice._id.toString(),
      invoiceNumber: invoice.inv_number,
      itemCount: invoice.items?.length || 0,
      timestamp: new Date().toISOString()
    }));

    return res.status(200).json(pdfData);

  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "invoice_pdf_generation_failed",
      invoiceId,
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString()
    }));

    return res.status(500).json({
      message: err.message
    });
  }
}