import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoice_number: { type: Number, required: true, unique: true },
  sales: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesOrder",
    required: true
  },
  due_date: { type: Date, required: true },
  invoice_date: { type: Date, required: true, default: Date.now },
  amount_due: { type: Number, required: true, min: 0 },
  amount_paid: { type: Number, default: 0, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["PAID", "DUE", "OVERDUE"],
    default: "DUE"
  }
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);