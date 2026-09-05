import express from "express";

import {
  createAnalyticAccount,
  getAnalyticAccounts,
  getAnalyticAccountById,
  updateAnalyticAccount
} from "../controllers/analyticAccountController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createAnalyticAccount);
router.get("/", protect, getAnalyticAccounts);

router.get("/:id", protect, getAnalyticAccountById);
router.patch("/:id", protect, updateAnalyticAccount);

export default router;