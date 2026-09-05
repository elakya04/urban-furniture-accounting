import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  inv_number: { type: String, required: true, unique: true },
  sales: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesOrder",
    required: false
  },
  customerName: { type: String, required: true },
  due_date: { type: String, required: true },
  invoice_date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  amount_due: { type: Number, required: true, min: 0 },
  amount_paid: { type: Number, default: 0, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["PAID", "DUE", "OVERDUE", "CANCEL"],
    default: "DUE"
  },
  items: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);