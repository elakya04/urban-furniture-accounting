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
import { protect } from "../middleware/auth.js";

const router = express.Router();


// Create Purchase Order
router.post(
  "/",
  protect,
  createPurchaseOrder
);


// Get all Purchase Orders
router.get(
  "/",
  protect,
  getPurchaseOrders
);


// Get Purchase Order by ID
router.get(
  "/:id",
  protect,
  getPurchaseOrderById
);


// Update Purchase Order
router.patch(
  "/:id",
  protect,
  updatePurchaseOrder
);


// Confirm Purchase Order
router.post(
  "/:id/confirm",
  protect,
  confirmPurchaseOrder
);


// Cancel Purchase Order
router.post(
  "/:id/cancel",
  protect,
  cancelPurchaseOrder
);


// Create Vendor Bill from Purchase Order
router.post(
  "/:id/vendor-bill",
  protect,
  createVendorBillFromPurchaseOrder
);

export default router;