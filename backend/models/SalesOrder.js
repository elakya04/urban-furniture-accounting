import mongoose from "mongoose";

const salesItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 },
  account: { type: String, default: 'coa_8' },
  budgetAnalytics: { type: String, default: null }
}, { _id: false });

const salesOrderSchema = new mongoose.Schema({
  so_number: { type: String, required: true },
  customer: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  customerName: { type: String, required: true },
  items: { type: [salesItemSchema], required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  total_amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["DRAFT", "CANCEL", "CONFIRMED", "INVOICE"],
    default: "DRAFT"
  }
}, { timestamps: true });

export default mongoose.model("SalesOrder", salesOrderSchema);