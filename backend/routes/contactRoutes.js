import express from "express";
import { archiveContact, getContactByLoginId, getContacts, updateContact } from "../controllers/ContactDetailsController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();


router.get("/loginDetails",protect,getContactByLoginId);//
router.get("/",protect,getContacts)//
router.patch("/", protect,updateContact);//
router.patch("/archive",protect, archiveContact);

export default router;