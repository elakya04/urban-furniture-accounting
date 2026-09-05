import express from "express";

import {
  createAnalyticAccount,
  getAnalyticAccounts,
  getAnalyticAccountById,
  updateAnalyticAccount
} from "../controllers/analyticAccountController.js";

const router = express.Router();

router.post("/", createAnalyticAccount);
router.get("/", getAnalyticAccounts);

router.get("/:id", getAnalyticAccountById);
router.patch("/:id", updateAnalyticAccount);

export default router;