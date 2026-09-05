import express from "express";
import {
  createContact,
  archiveContact,
  getContactByLoginId,
  getContacts,
  updateContact
} from "../controllers/ContactDetailsController.js";
import { protect } from "../middleware/auth.js";
import { authorize } from "../middleware/rbac.js";

const router = express.Router();

router.get("/loginDetails", protect, getContactByLoginId);
router.get("/", protect, authorize("ADMIN", "ACCOUNTANT"), getContacts);
router.post("/", protect, authorize("ADMIN", "ACCOUNTANT"), createContact);
router.patch("/:id/archive", protect, authorize("ADMIN"), archiveContact);
router.post("/:id/archive", protect, authorize("ADMIN"), archiveContact);
router.patch("/:id", protect, authorize("ADMIN", "ACCOUNTANT"), updateContact);
router.patch("/archive", protect, authorize("ADMIN"), archiveContact);
router.patch("/", protect, authorize("ADMIN", "ACCOUNTANT"), updateContact);

export default router;