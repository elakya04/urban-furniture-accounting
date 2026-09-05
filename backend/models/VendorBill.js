import mongoose from "mongoose";

const vendorBillSchema = new mongoose.Schema({
  bill_number: { type: Number, required: true, unique: true },
  sales: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PurchaseOrder",
    required: true
  },
  due_date: { type: Date, required: true },
  bill_date: { type: Date, required: true, default: Date.now },
  amount_due: { type: Number, required: true, min: 0 },
  amount_paid: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  status: {
  type: String,
  enum: ["DUE", "PAID", "OVERDUE", "CANCELLED"],
  default: "DUE"
},
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("VendorBill", vendorBillSchema);