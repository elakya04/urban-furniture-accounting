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
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.get("/", getSalesOrders);
router.post("/", createSalesOrder);
router.get("/:id", getSalesOrderById);
router.patch("/:id", updateSalesOrder);
router.post("/:id/confirm", confirmSalesOrder);
router.post("/:id/cancel", cancelSalesOrder);
router.post("/:id/invoice", createInvoiceFromSO);

export default router;
