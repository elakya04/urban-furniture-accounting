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

journalEntrySchema.pre("validate", function() {
  if (this.journalItems && this.journalItems.length > 0) {
    const debit = this.journalItems.reduce((sum, item) => sum + (item.debit || 0), 0);
    const credit = this.journalItems.reduce((sum, item) => sum + (item.credit || 0), 0);

    if (Math.abs(debit - credit) > 0.001) {
      throw new Error("Total debit must equal total credit");
    }
  }
});

export default mongoose.model("JournalEntry", journalEntrySchema);