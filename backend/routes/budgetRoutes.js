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

const router = express.Router();

router.post("/", createBudget);
router.get("/", getBudgets);

router.get("/:id", getBudgetById);
router.patch("/:id", updateBudget);

router.post("/:id/confirm", confirmBudget);
router.post("/:id/revise", reviseBudget);
router.post("/:id/cancel", cancelBudget);

router.get("/:id/report", getBudgetReport);

export default router;