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
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

// Budgets are managed by Admin and Accountant actors
router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.post("/", createBudget);
router.get("/", getBudgets);

router.get("/:id", getBudgetById);
router.patch("/:id", updateBudget);

router.post("/:id/confirm", confirmBudget);
router.post("/:id/revise", reviseBudget);
router.patch("/:id/revise", reviseBudget);
router.post("/:id/cancel", cancelBudget);

router.get("/:id/report", getBudgetReport);

export default router;