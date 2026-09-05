import express from "express";

import {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal
} from "../controllers/journalController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createJournal);
router.get("/", protect, getJournals);

router.get("/:id", protect, getJournalById);
router.patch("/:id", protect, updateJournal);

export default router;