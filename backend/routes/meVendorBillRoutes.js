import express from "express";

import {
  getMyVendorBills,
  getMyVendorBillById
} from "../controllers/vendorBillController.js";
import {
  getMyInvoices,
  getMyInvoiceById
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/vendor-bills", protect, getMyVendorBills);
router.get("/vendor-bills/:id", protect, getMyVendorBillById);
router.get("/invoices", protect, getMyInvoices);
router.get("/invoices/:id", protect, getMyInvoiceById);

export default router;