import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  userType: {
    type: String,
    enum: ["CUSTOMER", "VENDOR", "BOTH"],
    required: true
  },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: Number, required: true },
  address: {
    city: String,
    state: String,
    pincode: String
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  profileImage: {
    type: String,
    default: "https://via.placeholder.com/150"
  },
  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);