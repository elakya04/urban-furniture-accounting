import express from "express";

import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  postJournalEntry
} from "../controllers/journalEntryController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createJournalEntry);
router.get("/", protect, getJournalEntries);
router.get("/:id", protect, getJournalEntryById);
router.post("/:id/post", protect, postJournalEntry);

export default router;