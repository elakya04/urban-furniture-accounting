import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "COA",
    required: true
  },
  debit: { type: Number, required: true, default: 0, min: 0 },
  credit: { type: Number, required: true, default: 0, min: 0 }
}, { timestamps: true });

export default mongoose.model("Item", itemSchema);