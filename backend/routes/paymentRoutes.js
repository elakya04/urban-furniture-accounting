import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  confirmPayment,
  cancelPayment
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createPayment);
router.get("/", protect, getPayments);
router.get("/:id", protect, getPaymentById);
router.post("/:id/confirm", protect, confirmPayment);
router.post("/:id/cancel", protect, cancelPayment);

export default router;