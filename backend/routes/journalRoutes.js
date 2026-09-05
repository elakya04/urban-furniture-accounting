import express from "express";

import {
  createJournal,
  getJournals,
  getJournalById,
  updateJournal
} from "../controllers/journalController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.post("/", createJournal);
router.get("/", getJournals);

router.get("/:id", getJournalById);
router.patch("/:id", updateJournal);

export default router;