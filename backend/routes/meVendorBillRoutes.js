import express from "express";

import {
  getMyVendorBills,
  getMyVendorBillById
} from "../controllers/vendorBillController.js";

const router = express.Router();

router.get("/vendor-bills", getMyVendorBills);
router.get("/vendor-bills/:id", getMyVendorBillById);

export default router;