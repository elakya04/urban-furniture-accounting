import mongoose from "mongoose";

const salesItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const salesOrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  items: { type: [salesItemSchema], required: true },
  date: { type: Date, default: Date.now },
  total_amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["DRAFT", "CANCEL", "CONFIRMED", "INVOICE"],
    default: "DRAFT"
  }
}, { timestamps: true });

export default mongoose.model("SalesOrder", salesOrderSchema);