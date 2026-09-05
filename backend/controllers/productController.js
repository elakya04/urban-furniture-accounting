import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
// POST /api/products
// Create product + upload image
export const createProduct = async (req, res) => {
  try {
    const {
      productName,
      type,
      salesPrice,
      cost,
      category
    } = req.body;

    if (
      !productName ||
      !type ||
      salesPrice === undefined ||
      cost === undefined ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing"
      });
    }

    let productImage = "https://via.placeholder.com/150";

    // Image received from frontend
    if (req.file) {
      const file = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
        "base64"
      )}`;

      const result = await cloudinary.uploader.upload(file, {
        folder: "urban-furniture/products",
        resource_type: "image"
      });

      productImage = result.secure_url;
    }

    const product = await Product.create({
      productName,
      type,
      productImage,
      salesPrice,
      cost,
      category
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    });
  }
};


// GET /api/products
// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
};


// GET /api/products/:id
// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message
    });
  }
};


// PATCH /api/products/:id
// Update product details
export const updateProduct = async (req, res) => {
  try {
    const allowedFields = [
      "productName",
      "type",
      "salesPrice",
      "cost",
      "category"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
};


// POST /api/products/:id/archive
// Archive product
export const archiveProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product archived successfully",
      data: product
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to archive product",
      error: error.message
    });
  }
};


// POST /api/products/:id/image
// Upload / replace product image
export const uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required"
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const file = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
      "base64"
    )}`;

    const result = await cloudinary.uploader.upload(file, {
      folder: "urban-furniture/products",
      resource_type: "image"
    });

    product.productImage = result.secure_url;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product image uploaded successfully",
      data: {
        productId: product._id,
        productImage: product.productImage
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload product image",
      error: error.message
    });
  }
};