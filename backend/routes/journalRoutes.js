import express from "express";

import {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal
} from "../controllers/journalController.js";

const router = express.Router();

router.post("/", createJournal);
router.get("/", getJournals);

router.get("/:id", getJournalById);
router.patch("/:id", updateJournal);

export default router;