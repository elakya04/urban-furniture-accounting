import express from "express";

import {
  getVendorBills,
  getVendorBillById,
  confirmVendorBill,
  cancelVendorBill,
  getVendorBillPayments,
  getVendorBillPdf,
  getMyVendorBills,
  getMyVendorBillById
} from "../controllers/vendorBillController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();


// Vendor self-service routes
// IMPORTANT: keep these BEFORE /:id
router.get(
  "/me/vendor-bills",
  protect,
  getMyVendorBills
);

router.get(
  "/me/vendor-bills/:id",
  protect,
  getMyVendorBillById
);


// Get all vendor bills
router.get(
  "/",
  protect,
  getVendorBills
);


// Get vendor bill by ID
router.get(
  "/:id",
  protect,
  getVendorBillById
);


// Confirm vendor bill
router.post(
  "/:id/confirm",
  protect,
  confirmVendorBill
);


// Cancel vendor bill
router.post(
  "/:id/cancel",
  protect,
  cancelVendorBill
);


// Get payments for vendor bill
router.get(
  "/:id/payments",
  protect,
  getVendorBillPayments
);


// Generate vendor bill PDF
router.get(
  "/:id/pdf",
  protect,
  getVendorBillPdf
);

export default router;