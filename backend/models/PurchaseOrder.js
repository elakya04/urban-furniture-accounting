import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  productName: { type: String },
  account: { type: mongoose.Schema.Types.Mixed },
  accountName: { type: String },
  budgetAnalytics: { type: mongoose.Schema.Types.Mixed },
  budgetAnalyticsName: { type: String },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  purchase_id: { type: Number, required: true, unique: true },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true
  },status: {
      type: String,
      enum: ["DRAFT", "CONFIRMED", "CANCELLED"],
      default: "DRAFT"
    },
  items: { type: [purchaseItemSchema], required: true },
  total_amount: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);