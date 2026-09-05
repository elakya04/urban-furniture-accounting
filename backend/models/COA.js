import mongoose from "mongoose";

const coaSchema = new mongoose.Schema({
  accountName: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["ASSET", "LIABILITY", "EXPENSE", "INCOME", "CAPITAL"],
    required: true
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("COA", coaSchema);