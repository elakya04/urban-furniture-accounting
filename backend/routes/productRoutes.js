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
import { authorize } from "../middleware/rbac.js";
import uploadProfileImage from "../middleware/upload.js";

const router = express.Router();

// Create product + image (Admin and Accountant)
router.post(
  "/",
  protect,
  authorize("ADMIN", "ACCOUNTANT"),
  uploadProfileImage,
  createProduct
);

// Get all products (Catalog viewable by all authenticated users)
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

// Update product details (Admin and Accountant)
router.patch(
  "/:id",
  protect,
  authorize("ADMIN", "ACCOUNTANT"),
  updateProduct
);

// Archive product (Admin only per problem statement)
router.post(
  "/:id/archive",
  protect,
  authorize("ADMIN"),
  archiveProduct
);

// Upload / replace image (Admin and Accountant)
router.post(
  "/:id/image",
  protect,
  authorize("ADMIN", "ACCOUNTANT"),
  uploadProfileImage,
  uploadProductImage
);

export default router;