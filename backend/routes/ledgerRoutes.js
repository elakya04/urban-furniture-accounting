import express from "express";
import { getLedger } from "../controllers/ledgerController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.get("/:accid", getLedger);
router.get("/account/:accountId", getLedger);

export default router;