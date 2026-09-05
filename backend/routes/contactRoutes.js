import express from "express";
import { archiveContact, getContactByLoginId, getContacts, updateContact } from "../controllers/ContactDetailsController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.get("/loginDetails", protect, getContactByLoginId);
router.get("/", protect, authorize("ADMIN", "ACCOUNTANT"), getContacts);
router.patch("/", protect, authorize("ADMIN", "ACCOUNTANT"), updateContact);
router.patch("/archive", protect, authorize("ADMIN"), archiveContact);

export default router;