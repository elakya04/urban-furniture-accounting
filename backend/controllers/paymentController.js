import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import VendorBill from "../models/VendorBill.js";
import Contact from "../models/Contact.js";
import Journal from "../models/Journal.js";
import JournalEntry from "../models/JournalEntry.js";
import COA from "../models/COA.js";
import Razorpay from "razorpay";
import crypto from "crypto";


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
    // Find or Auto-Configure Journal & Accounts
    // ---------------------------------------

    let journalName =
      payment.type === "RECEIVE"
        ? payment.payment_method === "BANK"
          ? "Customer Receipt - Bank"
          : "Customer Receipt - Cash"
        : payment.payment_method === "BANK"
        ? "Vendor Payment - Bank"
        : "Vendor Payment - Cash";

    let journal = await Journal.findOne({
      journalName,
      type: payment.payment_method
    });

    if (!journal) {
      journal = await Journal.findOne({
        journalName: { $regex: new RegExp(`^${journalName}$`, "i") }
      });
    }

    if (!journal) {
      journal = await Journal.findOne({
        type: payment.payment_method
      });
    }

    let debitAccId = journal?.def_debitAcc;
    let creditAccId = journal?.def_creditAcc;

    if (!debitAccId || !creditAccId) {
      const assetAccounts = await COA.find({ type: "ASSET" });
      const liabilityAccounts = await COA.find({ type: "LIABILITY" });

      const bankAcc = assetAccounts.find(a => /bank/i.test(a.accountName)) || assetAccounts[0];
      const cashAcc = assetAccounts.find(a => /cash/i.test(a.accountName)) || assetAccounts[0];
      const payableAcc = liabilityAccounts.find(a => /payable/i.test(a.accountName)) || liabilityAccounts[0];
      const receivableAcc = assetAccounts.find(a => /receivable/i.test(a.accountName)) || assetAccounts[0];

      const resolvedBankAcc = bankAcc || await COA.create({ accountName: "HDFC Bank Operating", type: "ASSET", isActive: true });
      const resolvedCashAcc = cashAcc || await COA.create({ accountName: "Cash Operating Account", type: "ASSET", isActive: true });
      const resolvedPayableAcc = payableAcc || await COA.create({ accountName: "Accounts Payable Trade", type: "LIABILITY", isActive: true });
      const resolvedReceivableAcc = receivableAcc || await COA.create({ accountName: "Accounts Receivable Trade", type: "ASSET", isActive: true });

      const paymentAcc = payment.payment_method === "BANK" ? resolvedBankAcc : resolvedCashAcc;

      if (payment.type === "RECEIVE") {
        debitAccId = debitAccId || paymentAcc._id;
        creditAccId = creditAccId || resolvedReceivableAcc._id;
      } else {
        debitAccId = debitAccId || resolvedPayableAcc._id;
        creditAccId = creditAccId || paymentAcc._id;
      }

      if (journal) {
        journal.def_debitAcc = journal.def_debitAcc || debitAccId;
        journal.def_creditAcc = journal.def_creditAcc || creditAccId;
        await journal.save();
      } else {
        journal = await Journal.create({
          journalName,
          type: payment.payment_method,
          def_debitAcc: debitAccId,
          def_creditAcc: creditAccId
        });
      }
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
          account: debitAccId,
          debit: payment.amount,
          credit: 0
        },
        {
          account: creditAccId,
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

    await bill.save({ validateModifiedOnly: true });

    // ---------------------------------------
    // Confirm Payment
    // ---------------------------------------

    payment.status = "CONFIRM";

    await payment.save();

    let populatedBill = bill;
    if (payment.type === "RECEIVE") {
      populatedBill = await Invoice.findById(bill._id).populate("sales");
    } else {
      populatedBill = await VendorBill.findById(bill._id)
        .populate("vendor")
        .populate("sales")
        .populate("createdBy");
    }

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: {
        payment,
        journalEntry,
        bill: populatedBill || bill
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

// POST /api/payment/create-order
export const createOrder = async (req, res) => {
  try {
    const { amount, invoiceId, inv_number, customerName } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required"
      });
    }

    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_TW1Unx3k97P93z";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "QQbHLpHVIkvqNNlJcVsMxDWt";

    const razorpay = new Razorpay({
      key_id,
      key_secret
    });

    const amountInPaise = Math.round(Number(amount) * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        invoiceId: invoiceId || "",
        inv_number: inv_number || "",
        customerName: customerName || ""
      }
    });

    return res.status(201).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: key_id
    });
  } catch (error) {
    console.error("[RAZORPAY ORDER ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message
    });
  }
};

// POST /api/payment/verify
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      amount
    } = req.body;

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "QQbHLpHVIkvqNNlJcVsMxDWt";

    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature"
      });
    }

    let updatedInvoice = null;
    let paymentRecord = null;

    // Settle invoice and create Payment if invoiceId provided
    if (invoiceId) {
      const invoice = await Invoice.findById(invoiceId);
      if (invoice) {
        const payAmount = Number(amount) || invoice.amount_due;
        invoice.amount_paid = (invoice.amount_paid || 0) + payAmount;
        invoice.amount_due = Math.max(0, invoice.total_amount - invoice.amount_paid);
        invoice.status = invoice.amount_due === 0 ? "PAID" : "DUE";
        await invoice.save();
        updatedInvoice = invoice;

        // Create Payment record
        paymentRecord = await Payment.create({
          invoiceBill: invoice._id,
          payment_method: "BANK",
          amount: payAmount,
          type: "RECEIVE",
          status: "CONFIRM",
          date: new Date().toISOString().split("T")[0]
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      invoice: updatedInvoice,
      payment: paymentRecord
    });
  } catch (error) {
    console.error("[RAZORPAY VERIFY ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
};