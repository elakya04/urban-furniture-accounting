import express from "express";

import {
  getMyVendorBills,
  getMyVendorBillById
} from "../controllers/vendorBillController.js";
import { getMyInvoices } from "../controllers/invoiceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/vendor-bills", protect, getMyVendorBills);
router.get("/vendor-bills/:id", protect, getMyVendorBillById);
router.get("/invoices", protect, getMyInvoices);

export default router;