import express from "express";

import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  updateAccountStatus,
  getAccountLedger
} from "../controllers/accountController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.post("/", createAccount);
router.get("/", getAccounts);

router.get("/:id", getAccountById);
router.patch("/:id", updateAccount);
router.patch("/:id/status", authorize("ADMIN"), updateAccountStatus);

router.get("/:id/ledger", getAccountLedger);

export default router;