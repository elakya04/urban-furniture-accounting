import express from "express";

import {
  getProfitLoss,
  getBalanceSheet,
  getBudgetReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.get("/profit-loss", getProfitLoss);
router.get("/balance-sheet", getBalanceSheet);
router.get("/budget", getBudgetReport);

export default router;