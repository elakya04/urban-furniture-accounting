import express from "express";

import {
  createAnalyticAccount,
  getAnalyticAccounts,
  getAnalyticAccountById,
  updateAnalyticAccount
} from "../controllers/analyticAccountController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.post("/", createAnalyticAccount);
router.get("/", getAnalyticAccounts);

router.get("/:id", getAnalyticAccountById);
router.patch("/:id", updateAnalyticAccount);

export default router;