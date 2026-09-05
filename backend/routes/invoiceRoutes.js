import express from "express";
import {
  getInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
  getInvoicePayments,
  getInvoicePDF
} from "../controllers/invoiceController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getInvoices);
router.get("/:id", protect, getInvoiceById);
router.post("/:id/confirm", protect, confirmInvoice);
router.post("/:id/cancel", protect, cancelInvoice);
router.get("/:id/payments", protect, getInvoicePayments);
router.get("/:id/pdf", protect, getInvoicePDF);

export default router;
