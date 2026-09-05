import express from "express";
import {
  getInvoices,
  getInvoiceById,
  confirmInvoice,
  cancelInvoice,
  getInvoicePayments,
  getInvoicePDF
} from "../controllers/invoiceController.js";

const router = express.Router();

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.post("/:id/confirm", confirmInvoice);
router.post("/:id/cancel", cancelInvoice);
router.get("/:id/payments", getInvoicePayments);
router.get("/:id/pdf", getInvoicePDF);

export default router;
