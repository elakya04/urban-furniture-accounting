import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.use(protect, authorize("ADMIN", "ACCOUNTANT"));

router.get("/summary", getDashboardSummary);

export default router;