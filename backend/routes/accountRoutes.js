import express from "express";

import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  updateAccountStatus,
  getAccountLedger
} from "../controllers/accountController.js";

const router = express.Router();

router.post("/", createAccount);
router.get("/", getAccounts);

router.get("/:id", getAccountById);
router.patch("/:id", updateAccount);
router.patch("/:id/status", updateAccountStatus);

router.get("/:id/ledger", getAccountLedger);

export default router;