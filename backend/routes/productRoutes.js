import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  archiveProduct,
  uploadProductImage
} from "../controllers/productController.js";

// import upload from "../middleware/upload.js";
import uploadProfileImage from "../middleware/upload.js";

const router = express.Router();

// Create product + image
router.post(
  "/",
  uploadProfileImage,
  createProduct
);

// Get all products
router.get(
  "/",
  getProducts
);

// Get product by ID
router.get(
  "/:id",
  getProductById
);

// Update product details
router.patch(
  "/:id",
  updateProduct
);

// Archive product
router.post(
  "/:id/archive",
  archiveProduct
);

// Upload / replace image
router.post(
  "/:id/image",
  upload.single("image"),
  uploadProductImage
);

export default router;