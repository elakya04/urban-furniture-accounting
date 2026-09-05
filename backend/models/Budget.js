import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  analytics_account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AnalyticsAccount",
    required: true
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  type: {
    type: String,
    enum: ["INCOME", "EXPENSE"],
    required: true
  },
  committed_amount: { type: Number, required: true, min: 0 },
  achieved_amount: { type: Number, default: 0, min: 0 },
  responsiblePerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["DRAFT", "CONFIRMED", "CANCELLED"],
    default: "DRAFT"
  }
}, { timestamps: true });

export default mongoose.model("Budget", budgetSchema);