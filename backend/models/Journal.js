import mongoose from "mongoose";

const journalSchema = new mongoose.Schema({
  journalName: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["SALES", "PURCHASE", "BANK", "CASH"],
    required: true
  },
  def_debitAcc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "COA"
  },
  def_creditAcc: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "COA"
  }
}, { timestamps: true });

export default mongoose.model("Journal", journalSchema);