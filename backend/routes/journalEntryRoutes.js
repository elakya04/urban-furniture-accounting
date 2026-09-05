import express from "express";

import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  postJournalEntry
} from "../controllers/journalEntryController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

// General Ledger and Journal Entries are strictly restricted to Admin and Accountant
router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.post("/", createJournalEntry);
router.get("/", getJournalEntries);
router.get("/:id", getJournalEntryById);
router.post("/:id/post", postJournalEntry);

export default router;