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

const router = express.Router();


// Vendor self-service routes
// IMPORTANT: keep these BEFORE /:id
router.get(
  "/me/vendor-bills",
  getMyVendorBills
);

router.get(
  "/me/vendor-bills/:id",
  getMyVendorBillById
);


// Get all vendor bills
router.get(
  "/",
  getVendorBills
);


// Get vendor bill by ID
router.get(
  "/:id",
  getVendorBillById
);


// Confirm vendor bill
router.post(
  "/:id/confirm",
  confirmVendorBill
);


// Cancel vendor bill
router.post(
  "/:id/cancel",
  cancelVendorBill
);


// Get payments for vendor bill
router.get(
  "/:id/payments",
  getVendorBillPayments
);


// Generate vendor bill PDF
router.get(
  "/:id/pdf",
  getVendorBillPdf
);

export default router;