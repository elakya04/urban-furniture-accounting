import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  invoiceBill: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  vendorbill: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  payment_method: {
    type: String,
    enum: ["CASH", "BANK"],
    required: true
  },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["DRAFT", "CONFIRM", "CANCEL"],
    default: "DRAFT"
  },
  type: {
    type: String,
    enum: ["SEND", "RECEIVE"],
    required: true
  },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);