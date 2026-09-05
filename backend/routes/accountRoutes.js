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

const router = express.Router();

router.post("/", protect, createAccount);
router.get("/", protect, getAccounts);

router.get("/:id", protect, getAccountById);
router.patch("/:id", protect, updateAccount);
router.patch("/:id/status", protect, updateAccountStatus);

router.get("/:id/ledger", protect, getAccountLedger);

export default router;