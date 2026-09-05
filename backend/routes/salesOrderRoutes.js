import express from "express";
import {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  confirmSalesOrder,
  cancelSalesOrder,
  createInvoiceFromSO
} from "../controllers/salesOrderController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getSalesOrders);
router.post("/", protect, createSalesOrder);
router.get("/:id", protect, getSalesOrderById);
router.patch("/:id", protect, updateSalesOrder);
router.post("/:id/confirm", protect, confirmSalesOrder);
router.post("/:id/cancel", protect, cancelSalesOrder);
router.post("/:id/invoice", protect, createInvoiceFromSO);

export default router;
