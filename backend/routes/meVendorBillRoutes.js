import express from "express";

import {
  getMyVendorBills,
  getMyVendorBillById
} from "../controllers/vendorBillController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/vendor-bills", protect, getMyVendorBills);
router.get("/vendor-bills/:id", protect, getMyVendorBillById);

export default router;