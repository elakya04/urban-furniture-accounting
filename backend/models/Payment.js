import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  invoiceBill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Invoice",
    default: null
  },
  vendorbill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "VendorBill",
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
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);