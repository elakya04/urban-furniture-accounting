import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["ADMIN", "ACCOUNTANT", "CONTACT"],
    required: true
  },
  contact_id: {
    type: String,
    enum: ["CUSTOMER", "VENDOR", "BOTH"],
    required: function () {
      return this.role === "CONTACT";
    }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("User", userSchema);