import express from "express";

import {
  createJournalEntry,
  getJournalEntries,
  getJournalEntryById,
  postJournalEntry
} from "../controllers/journalEntryController.js";

const router = express.Router();

router.post("/", createJournalEntry);
router.get("/", getJournalEntries);
router.get("/:id", getJournalEntryById);
router.post("/:id/post", postJournalEntry);

export default router;