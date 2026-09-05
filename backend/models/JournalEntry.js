import mongoose from "mongoose";

const journalItemSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "COA",
    required: true
  },
  debit: { type: Number, default: 0, min: 0 },
  credit: { type: Number, default: 0, min: 0 }
}, { _id: false });

const journalEntrySchema = new mongoose.Schema({
  journal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Journal",
    required: true
  },
  date: { type: Date, default: Date.now },
  inv_bill: { type: String },
  journalItems: {
    type: [journalItemSchema],
    required: true
  },
  sourceType: {
    type: String,
    enum: ["INVOICE", "VENDOR_BILL", "PAYMENT"],
    required: true
  },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: {
    type: String,
    enum: ["DRAFT", "POSTED"],
    default: "DRAFT"
  },
  invoice_order_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesOrder"
  }
}, { timestamps: true });

journalEntrySchema.pre("validate", function(next) {
  const debit = this.journalItems.reduce((sum, item) => sum + item.debit, 0);
  const credit = this.journalItems.reduce((sum, item) => sum + item.credit, 0);

  if (debit !== credit) {
    return next(new Error("Total debit must equal total credit"));
  }
  next();
});

export default mongoose.model("JournalEntry", journalEntrySchema);