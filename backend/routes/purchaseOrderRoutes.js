import express from "express";

import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  confirmPurchaseOrder,
  cancelPurchaseOrder,
  createVendorBillFromPurchaseOrder
} from "../controllers/purchaseOrderController.js";

const router = express.Router();


// Create Purchase Order
router.post(
  "/",
  createPurchaseOrder
);


// Get all Purchase Orders
router.get(
  "/",
  getPurchaseOrders
);


// Get Purchase Order by ID
router.get(
  "/:id",
  getPurchaseOrderById
);


// Update Purchase Order
router.patch(
  "/:id",
  updatePurchaseOrder
);


// Confirm Purchase Order
router.post(
  "/:id/confirm",
  confirmPurchaseOrder
);


// Cancel Purchase Order
router.post(
  "/:id/cancel",
  cancelPurchaseOrder
);


// Create Vendor Bill from Purchase Order
router.post(
  "/:id/vendor-bill",
  createVendorBillFromPurchaseOrder
);

export default router;