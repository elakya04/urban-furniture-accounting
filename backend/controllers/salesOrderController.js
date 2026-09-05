import mongoose from "mongoose";
import SalesOrder from "../models/SalesOrder.js";
import Invoice from "../models/Invoice.js";

// Helper function to safely find Sales Order by ObjectId or so_number
async function findOrderByIdOrSeq(id) {
  if (!id) return null;
  if (mongoose.isValidObjectId(id)) {
    const order = await SalesOrder.findById(id);
    if (order) return order;
  }
  return await SalesOrder.findOne({ so_number: id });
}

// GET /api/sales-orders - Get all sales orders
export async function getSalesOrders(req, res) {
  try {
    const orders = await SalesOrder.find().sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// GET /api/sales-orders/:id - Get single sales order by ID or sequence number
export async function getSalesOrderById(req, res) {
  try {
    const order = await findOrderByIdOrSeq(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sales order not found" });
    }
    return res.status(200).json(order);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// POST /api/sales-orders - Create a new sales order
export async function createSalesOrder(req, res) {
  try {
    const { customer, customerName, items, total_amount, date, so_number } = req.body;

    if (!customerName || !items || !items.length) {
      return res.status(400).json({ message: "Customer name and items are required" });
    }

    const count = await SalesOrder.countDocuments();
    const generatedSeq = so_number || `S${String(count + 1).padStart(5, "0")}`;

    // Clean up items array to handle string IDs gracefully
    const sanitizedItems = items.map(item => ({
      ...item,
      productName: item.productName || item.product || 'Product Item',
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || 0),
      total: Number(item.total || (Number(item.quantity || 1) * Number(item.unitPrice || 0)))
    }));

    const newOrder = await SalesOrder.create({
      so_number: generatedSeq,
      customer: customer || null,
      customerName,
      items: sanitizedItems,
      total_amount: Number(total_amount || sanitizedItems.reduce((acc, i) => acc + i.total, 0)),
      date: date || new Date().toISOString().split("T")[0],
      status: "DRAFT"
    });

    return res.status(201).json({
      message: "Sales Order created successfully",
      salesOrder: newOrder
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// PATCH /api/sales-orders/:id - Update sales order
export async function updateSalesOrder(req, res) {
  try {
    const order = await findOrderByIdOrSeq(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    Object.assign(order, req.body);
    await order.save();

    return res.status(200).json({
      message: "Sales Order updated successfully",
      salesOrder: order
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// POST /api/sales-orders/:id/confirm - Confirm sales order
export async function confirmSalesOrder(req, res) {
  try {
    const order = await findOrderByIdOrSeq(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    order.status = "CONFIRMED";
    await order.save();

    return res.status(200).json({
      message: `Sales Order ${order.so_number} confirmed`,
      salesOrder: order
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// POST /api/sales-orders/:id/cancel - Cancel sales order
export async function cancelSalesOrder(req, res) {
  try {
    const order = await findOrderByIdOrSeq(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    order.status = "CANCEL";
    await order.save();

    return res.status(200).json({
      message: `Sales Order ${order.so_number} cancelled`,
      salesOrder: order
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

// POST /api/sales-orders/:id/invoice - Generate invoice from sales order
export async function createInvoiceFromSO(req, res) {
  try {
    const order = await findOrderByIdOrSeq(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Sales order not found" });
    }

    order.status = "INVOICE";
    await order.save();

    const invCount = await Invoice.countDocuments();
    const nextInvSeq = `INV/2026/${String(invCount + 1).padStart(4, "0")}`;

    const newInvoice = await Invoice.create({
      inv_number: nextInvSeq,
      sales: order._id,
      customerName: order.customerName,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      total_amount: order.total_amount,
      amount_paid: 0,
      amount_due: order.total_amount,
      status: "DUE",
      items: order.items
    });

    return res.status(201).json({
      message: `Invoice ${nextInvSeq} generated for Sales Order ${order.so_number}`,
      invoice: newInvoice,
      salesOrder: order
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
