import express from "express";

import {
  getProfitLoss,
  getBalanceSheet,
  getBudgetReport,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/profit-loss", getProfitLoss);
router.get("/balance-sheet", getBalanceSheet);
router.get("/budget", getBudgetReport);

export default router;