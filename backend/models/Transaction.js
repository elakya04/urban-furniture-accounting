import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 0 },
  billType: { type: String, enum: ["Invoice", "VendorBill"], required: true },
  bill: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "billType",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);