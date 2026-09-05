import mongoose from "mongoose";

const analyticsAccountSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["INCOME", "EXPENSE"],
    required: true
  }
}, { timestamps: true });

export default mongoose.model("AnalyticsAccount", analyticsAccountSchema);