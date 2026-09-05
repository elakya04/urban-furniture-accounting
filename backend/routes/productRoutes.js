import express from "express";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  archiveProduct,
  uploadProductImage
} from "../controllers/productController.js";

import { protect } from "../middleware/auth.js";
import uploadProfileImage from "../middleware/upload.js";

const router = express.Router();

// Create product + image
router.post(
  "/",
  protect,
  uploadProfileImage,
  createProduct
);

// Get all products
router.get(
  "/",
  protect,
  getProducts
);

// Get product by ID
router.get(
  "/:id",
  protect,
  getProductById
);

// Update product details
router.patch(
  "/:id",
  protect,
  updateProduct
);

// Archive product
router.post(
  "/:id/archive",
  protect,
  archiveProduct
);

// Upload / replace image
router.post(
  "/:id/image",
  protect,
  uploadProfileImage,
  uploadProductImage
);

export default router;