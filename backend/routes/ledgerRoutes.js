import express from "express";
import { getLedger } from "../controllers/ledgerController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/:accid", protect, getLedger);
router.get("/account/:accountId", protect, getLedger);

export default router;