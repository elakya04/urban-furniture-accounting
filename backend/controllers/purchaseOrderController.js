import mongoose from "mongoose";
import PurchaseOrder from "../models/PurchaseOrder.js";
import VendorBill from "../models/VendorBill.js";
import Contact from "../models/Contact.js";
import Product from "../models/Product.js";


// POST /api/purchase-orders
// Create Purchase Order
export const createPurchaseOrder = async (req, res) => {
  try {
    const {
      purchase_id,
      vendor,
      items,
      total_amount,
      date
    } = req.body;

    if (!purchase_id || !vendor || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Purchase ID, vendor and items are required"
      });
    }

    // Validate vendor
    const vendorExists = await Contact.findOne({
      _id: vendor,
      userType: { $in: ["VENDOR", "BOTH"] }
    });

    if (!vendorExists) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Validate products
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${item.product}`
        });
      }

      const productExists = await Product.findById(item.product);

      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1"
        });
      }

      if (item.unitPrice === undefined || item.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid unit price"
        });
      }
    }

    // Calculate item totals
    const processedItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const tax = Number(item.tax || 0);

      const subtotal = quantity * unitPrice;
      const total = subtotal + tax;

      return {
        product: item.product,
        quantity,
        unitPrice,
        tax,
        total
      };
    });

    // Calculate PO total from items
    const calculatedTotal = processedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const purchaseOrder = await PurchaseOrder.create({
      purchase_id,
      vendor,
      items: processedItems,
      total_amount:
        total_amount !== undefined
          ? Number(total_amount)
          : calculatedTotal,
      date: date || Date.now(),
      status: "DRAFT"
    });

    const populatedPO = await PurchaseOrder.findById(
      purchaseOrder._id
    )
      .populate("vendor")
      .populate("items.product");

    return res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: populatedPO
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create purchase order",
      error: error.message
    });
  }
};


// GET /api/purchase-orders
// Get all Purchase Orders
export const getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate("vendor")
      .populate("items.product")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: purchaseOrders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase orders",
      error: error.message
    });
  }
};


// GET /api/purchase-orders/:id
// Get Purchase Order by ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("vendor")
      .populate("items.product");

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: purchaseOrder
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase order",
      error: error.message
    });
  }
};


// PATCH /api/purchase-orders/:id
// Update Purchase Order
export const updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    // Only DRAFT PO can be edited
    if (purchaseOrder.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft purchase orders can be updated"
      });
    }

    const allowedFields = [
      "purchase_id",
      "vendor",
      "items",
      "total_amount",
      "date"
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        purchaseOrder[field] = req.body[field];
      }
    }

    await purchaseOrder.save();

    const updatedPO = await PurchaseOrder.findById(
      purchaseOrder._id
    )
      .populate("vendor")
      .populate("items.product");

    return res.status(200).json({
      success: true,
      message: "Purchase order updated successfully",
      data: updatedPO
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update purchase order",
      error: error.message
    });
  }
};


// POST /api/purchase-orders/:id/confirm
// Confirm Purchase Order
export const confirmPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    if (purchaseOrder.status !== "DRAFT") {
      return res.status(400).json({
        success: false,
        message: "Only draft purchase orders can be confirmed"
      });
    }

    purchaseOrder.status = "CONFIRMED";

    await purchaseOrder.save();

    return res.status(200).json({
      success: true,
      message: "Purchase order confirmed successfully",
      data: purchaseOrder
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to confirm purchase order",
      error: error.message
    });
  }
};


// POST /api/purchase-orders/:id/cancel
// Cancel Purchase Order
export const cancelPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    if (purchaseOrder.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Purchase order is already cancelled"
      });
    }

    // Don't allow cancellation once bill exists
    const existingBill = await VendorBill.findOne({
      sales: purchaseOrder._id
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: "Purchase order cannot be cancelled after vendor bill creation"
      });
    }

    purchaseOrder.status = "CANCELLED";

    await purchaseOrder.save();

    return res.status(200).json({
      success: true,
      message: "Purchase order cancelled successfully",
      data: purchaseOrder
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel purchase order",
      error: error.message
    });
  }
};


// POST /api/purchase-orders/:id/vendor-bill
// Create Vendor Bill from Purchase Order
export const createVendorBillFromPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    if (purchaseOrder.status !== "CONFIRMED") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed purchase orders can generate a vendor bill"
      });
    }

    // Prevent duplicate vendor bills
    const existingBill = await VendorBill.findOne({
      sales: purchaseOrder._id
    });

    if (existingBill) {
      return res.status(400).json({
        success: false,
        message: "Vendor bill already exists for this purchase order",
        data: existingBill
      });
    }

    const {
      bill_number,
      due_date,
      bill_date
    } = req.body;

    if (!bill_number || !due_date) {
      return res.status(400).json({
        success: false,
        message: "Bill number and due date are required"
      });
    }

    const vendorBill = await VendorBill.create({
      bill_number,
      sales: purchaseOrder._id,
      due_date,
      bill_date: bill_date || Date.now(),
      amount_due: purchaseOrder.total_amount,
      amount_paid: 0,
      total: purchaseOrder.total_amount,
      vendor: purchaseOrder.vendor,
      createdBy: req.user?._id,
      status: "DUE"
    });

    const populatedBill = await VendorBill.findById(
      vendorBill._id
    )
      .populate("vendor")
      .populate("sales");

    return res.status(201).json({
      success: true,
      message: "Vendor bill created successfully",
      data: populatedBill
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create vendor bill",
      error: error.message
    });
  }
};