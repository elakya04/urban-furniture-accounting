import VendorBill from "../models/VendorBill.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Payment from "../models/Payment.js";


// GET /api/vendor-bills
// Get all Vendor Bills
export const getVendorBills = async (req, res) => {
  try {
    const vendorBills = await VendorBill.find()
      .populate("vendor")
      .populate("sales")
      .populate("createdBy")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: vendorBills
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor bills",
      error: error.message
    });
  }
};


// GET /api/vendor-bills/:id
// Get Vendor Bill by ID
export const getVendorBillById = async (req, res) => {
  try {
    const vendorBill = await VendorBill.findById(req.params.id)
      .populate("vendor")
      .populate("sales")
      .populate("createdBy");

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: "Vendor bill not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: vendorBill
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor bill",
      error: error.message
    });
  }
};


// POST /api/vendor-bills/:id/confirm
// Confirm Vendor Bill
export const confirmVendorBill = async (req, res) => {
  try {
    const vendorBill = await VendorBill.findById(req.params.id);

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: "Vendor bill not found"
      });
    }

    if (vendorBill.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled vendor bill cannot be confirmed"
      });
    }

    if (vendorBill.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Paid vendor bill is already confirmed"
      });
    }

    vendorBill.status = "DUE";

    await vendorBill.save();

    return res.status(200).json({
      success: true,
      message: "Vendor bill confirmed successfully",
      data: vendorBill
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm vendor bill",
      error: error.message
    });
  }
};


// POST /api/vendor-bills/:id/cancel
// Cancel Vendor Bill
export const cancelVendorBill = async (req, res) => {
  try {
    const vendorBill = await VendorBill.findById(req.params.id);

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: "Vendor bill not found"
      });
    }

    if (vendorBill.status === "PAID") {
      return res.status(400).json({
        success: false,
        message: "Paid vendor bill cannot be cancelled"
      });
    }

    const existingPayments = await Payment.find({
      vendorbill: vendorBill._id,
      status: "CONFIRM"
    });

    if (existingPayments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Vendor bill cannot be cancelled because payments exist"
      });
    }

    vendorBill.status = "CANCELLED";

    await vendorBill.save();

    return res.status(200).json({
      success: true,
      message: "Vendor bill cancelled successfully",
      data: vendorBill
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel vendor bill",
      error: error.message
    });
  }
};


// GET /api/vendor-bills/:id/payments
// Get payments for Vendor Bill
export const getVendorBillPayments = async (req, res) => {
  try {
    const vendorBill = await VendorBill.findById(req.params.id);

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: "Vendor bill not found"
      });
    }

    const payments = await Payment.find({
      vendorbill: vendorBill._id
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      data: payments
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor bill payments",
      error: error.message
    });
  }
};


// GET /api/vendor-bills/:id/pdf
// Generate Vendor Bill PDF
export const getVendorBillPdf = async (req, res) => {
  try {
    const vendorBill = await VendorBill.findById(req.params.id)
      .populate("vendor")
      .populate({
        path: "sales",
        populate: {
          path: "items.product"
        }
      });

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: "Vendor bill not found"
      });
    }

    // Requires: npm install pdfkit
    const PDFDocument = (await import("pdfkit")).default;

    const doc = new PDFDocument({
      margin: 50
    });

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename=vendor-bill-${vendorBill.bill_number}.pdf`
    );

    doc.pipe(res);

    doc
      .fontSize(20)
      .text("URBAN FURNITURE", {
        align: "center"
      });

    doc.moveDown();

    doc
      .fontSize(16)
      .text("VENDOR BILL", {
        align: "center"
      });

    doc.moveDown(2);

    doc.fontSize(11);

    doc.text(`Bill Number: ${vendorBill.bill_number}`);
    doc.text(
      `Bill Date: ${new Date(vendorBill.bill_date).toLocaleDateString()}`
    );
    doc.text(
      `Due Date: ${new Date(vendorBill.due_date).toLocaleDateString()}`
    );
    doc.text(`Status: ${vendorBill.status}`);

    doc.moveDown();

    doc.text(`Vendor: ${vendorBill.vendor?.name || "N/A"}`);
    doc.text(`Email: ${vendorBill.vendor?.email || "N/A"}`);

    doc.moveDown(2);

    doc.text("Purchase Order Items");

    doc.moveDown();

    if (vendorBill.sales?.items) {
      vendorBill.sales.items.forEach((item, index) => {
        doc.text(
          `${index + 1}. ${
            item.product?.productName || "Product"
          } | Qty: ${item.quantity} | Unit Price: ${item.unitPrice} | Tax: ${item.tax} | Total: ${item.total}`
        );

        doc.moveDown(0.5);
      });
    }

    doc.moveDown();

    doc.text(`Total: ${vendorBill.total}`);
    doc.text(`Amount Paid: ${vendorBill.amount_paid}`);
    doc.text(`Amount Due: ${vendorBill.amount_due}`);

    doc.end();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate vendor bill PDF",
      error: error.message
    });
  }
};


// GET /api/me/vendor-bills
// Vendor self-service: get own bills
export const getMyVendorBills = async (req, res) => {
  try {
    const vendorContactId = req.user?.contact_id || req.contactid || req.user?._id;
    const vendorBills = await VendorBill.find({
      vendor: vendorContactId
    })
      .populate("sales")
      .populate("vendor")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: vendorBills
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your vendor bills",
      error: error.message
    });
  }
};


// GET /api/me/vendor-bills/:id
// Vendor self-service: get own bill
export const getMyVendorBillById = async (req, res) => {
  try {
    const vendorContactId = req.user?.contact_id || req.contactid || req.user?._id;
    const vendorBill = await VendorBill.findOne({
      _id: req.params.id,
      vendor: vendorContactId
    })
      .populate("sales")
      .populate("vendor");

    if (!vendorBill) {
      return res.status(404).json({
        success: false,
        message: "Vendor bill not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: vendorBill
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch vendor bill",
      error: error.message
    });
  }
};

