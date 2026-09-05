import express from "express";

import {
  createPayment,
  getPayments,
  getPaymentById,
  confirmPayment,
  cancelPayment
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", createPayment);
router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/:id/confirm", confirmPayment);
router.post("/:id/cancel", cancelPayment);

export default router;