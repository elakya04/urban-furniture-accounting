import express from "express";

import { register, login, logout, me} from "../controllers/authController.js";

import {protect} from "../middleware/auth.js";
import uploadProfileImage from "../middleware/upload.js";

const router = express.Router();

router.post("/register",uploadProfileImage,register);

// router.post("/register-contact",registerContact);

router.post("/login",login);

router.post("/logout",protect,logout);

router.get("/me",protect,me);

export default router;