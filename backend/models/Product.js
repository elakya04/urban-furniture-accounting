import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["GOODS", "SERVICE", "COMBO"],
    required: true
  },
  salesPrice: { type: Number, required: true, min: 0 },
  cost: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Product", productSchema);