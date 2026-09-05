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
import { authorize } from "../middleware/rbac.js";

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


// Get all vendor bills (Admin & Accountant only)
router.get(
  "/",
  protect,
  authorize("ADMIN", "ACCOUNTANT"),
  getVendorBills
);


// Get vendor bill by ID
router.get(
  "/:id",
  protect,
  getVendorBillById
);


// Confirm vendor bill (Admin & Accountant only)
router.post(
  "/:id/confirm",
  protect,
  authorize("ADMIN", "ACCOUNTANT"),
  confirmVendorBill
);


// Cancel vendor bill (Admin & Accountant only)
router.post(
  "/:id/cancel",
  protect,
  authorize("ADMIN", "ACCOUNTANT"),
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