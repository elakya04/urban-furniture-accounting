import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import VendorBill from "../models/VendorBill.js";
import Journal from "../models/Journal.js";
import JournalEntry from "../models/JournalEntry.js";


// Create Payment
export const createPayment = async (req, res) => {
  try {
    const {
      invoiceBill,
      vendorbill,
      payment_method,
      amount,
      type,
      date
    } = req.body;

    // Basic validation
    if (!payment_method || amount === undefined || amount === null || !type) {
      return res.status(400).json({
        success: false,
        message: "payment_method, amount and type are required"
      });
    }

    if (!["CASH", "BANK"].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    if (!["SEND", "RECEIVE"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment type"
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0"
      });
    }

    // RECEIVE -> Invoice
    if (type === "RECEIVE") {
      if (!invoiceBill || vendorbill) {
        return res.status(400).json({
          success: false,
          message: "A RECEIVE payment must be linked to an invoice"
        });
      }

      const invoice = await Invoice.findById(invoiceBill);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found"
        });
      }

      const remainingAmount =
        invoice.total_amount - invoice.amount_paid;

      if (remainingAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invoice is already fully paid"
        });
      }

      if (amount > remainingAmount) {
        return res.status(400).json({
          success: false,
          message: `Payment exceeds remaining invoice amount of ${remainingAmount}`
        });
      }
    }

    // SEND -> VendorBill
    if (type === "SEND") {
      if (!vendorbill || invoiceBill) {
        return res.status(400).json({
          success: false,
          message: "A SEND payment must be linked to a vendor bill"
        });
      }

      const vendorBill = await VendorBill.findById(vendorbill);

      if (!vendorBill) {
        return res.status(404).json({
          success: false,
          message: "Vendor bill not found"
        });
      }

      const remainingAmount =
        vendorBill.total - vendorBill.amount_paid;

      if (remainingAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Vendor bill is already fully paid"
        });
      }

      if (amount > remainingAmount) {
        return res.status(400).json({
          success: false,
          message: `Payment exceeds remaining vendor bill amount of ${remainingAmount}`
        });
      }
    }

    const payment = await Payment.create({
      invoiceBill: type === "RECEIVE" ? invoiceBill : undefined,
      vendorbill: type === "SEND" ? vendorbill : undefined,
      payment_method,
      amount,
      type,
      date: date || new Date(),
      status: "DRAFT"
    });

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message
    });
  }
};


// Get all Payments
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("invoiceBill")
      .populate("vendorbill")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message
    });
  }
};


// Get Payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("invoiceBill")
      .populate("vendorbill");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: payment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message
    });
  }
};


// Confirm Payment
export const confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Only DRAFT payments can be confirmed
    if (payment.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: `Payment cannot be confirmed from ${payment.status} state`
      });
    }

    // ---------------------------------------
    // Find related bill
    // ---------------------------------------

    let bill;
    let billType;

    if (payment.type === "RECEIVE") {
      bill = await Invoice.findById(payment.invoiceBill);
      billType = "Invoice";
    } else {
      bill = await VendorBill.findById(payment.vendorbill);
      billType = "VendorBill";
    }

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: `${billType} not found`
      });
    }

    // ---------------------------------------
    // Calculate remaining amount
    // ---------------------------------------

    const total =
      payment.type === "RECEIVE"
        ? bill.total_amount
        : bill.total;

    const remainingAmount =
      total - bill.amount_paid;

    if (payment.amount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds remaining amount of ${remainingAmount}`
      });
    }

    // ---------------------------------------
    // Find correct journal
    // ---------------------------------------

    let journalName;

    if (payment.type === "RECEIVE") {
      journalName =
        payment.payment_method === "BANK"
          ? "Customer Receipt - Bank"
          : "Customer Receipt - Cash";
    } else {
      journalName =
        payment.payment_method === "BANK"
          ? "Vendor Payment - Bank"
          : "Vendor Payment - Cash";
    }

    const journal = await Journal.findOne({
      journalName,
      type: payment.payment_method
    });

    if (!journal) {
      return res.status(400).json({
        success: false,
        message: `${journalName} journal is not configured`
      });
    }

    if (!journal.def_debitAcc || !journal.def_creditAcc) {
      return res.status(400).json({
        success: false,
        message: `${journalName} journal does not have default accounts configured`
      });
    }

    // ---------------------------------------
    // Create Journal Entry
    // ---------------------------------------

    const journalEntry = await JournalEntry.create({
      journal: journal._id,

      date: payment.date,

      inv_bill:
        payment.type === "RECEIVE"
          ? String(payment.invoiceBill)
          : String(payment.vendorbill),

      journalItems: [
        {
          account: journal.def_debitAcc,
          debit: payment.amount,
          credit: 0
        },
        {
          account: journal.def_creditAcc,
          debit: 0,
          credit: payment.amount
        }
      ],

      sourceType: "PAYMENT",
      sourceId: payment._id,
      status: "POSTED"
    });

    // ---------------------------------------
    // Update Invoice / VendorBill
    // ---------------------------------------

    bill.amount_paid += payment.amount;

    bill.amount_due = Math.max(
      total - bill.amount_paid,
      0
    );

    if (bill.amount_paid >= total) {
      bill.status = "PAID";
    } else {
      bill.status = "DUE";
    }

    await bill.save();

    // ---------------------------------------
    // Confirm Payment
    // ---------------------------------------

    payment.status = "CONFIRM";

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: {
        payment,
        journalEntry,
        bill
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message
    });
  }
};


// Cancel Payment
export const cancelPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft payments can be cancelled"
      });
    }

    payment.status = "CANCEL";

    await payment.save();

    return res.status(200).json({
      success: true,
      message: "Payment cancelled successfully",
      data: payment
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel payment",
      error: error.message
    });
  }
};