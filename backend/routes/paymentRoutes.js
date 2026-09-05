import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  confirmPayment,
  cancelPayment,
  createOrder,
  verifyPayment
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

// Razorpay standard checkout endpoints
router.post("/create-order", createOrder);
router.post("/verify", verifyPayment);

router.post("/", protect, createPayment);
router.get("/", protect, authorize("ADMIN", "ACCOUNTANT"), getPayments);
router.get("/:id", protect, getPaymentById);
router.post("/:id/confirm", protect, authorize("ADMIN", "ACCOUNTANT"), confirmPayment);
router.post("/:id/cancel", protect, authorize("ADMIN", "ACCOUNTANT"), cancelPayment);

export default router;