import express from "express";

import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  confirmBudget,
  reviseBudget,
  cancelBudget,
  getBudgetReport
} from "../controllers/budgetController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createBudget);
router.get("/", protect, getBudgets);

router.get("/:id", protect, getBudgetById);
router.patch("/:id", protect, updateBudget);

router.post("/:id/confirm", protect, confirmBudget);
router.post("/:id/revise", protect, reviseBudget);
router.post("/:id/cancel", protect, cancelBudget);

router.get("/:id/report", protect, getBudgetReport);

export default router;