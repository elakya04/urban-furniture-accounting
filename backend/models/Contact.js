import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  loginId: {type: String, required: true, unique: true, minlength: 6, maxlength: 12},
  userType: {
    type: String,
    enum: ["ACCOUNTANT","CONTACT","ADMIN"],
    required: true
  },
  email: { type: String, required: true, trim: true, lowercase: true },
  mobile: { type: Number, required: true },
  city: {type: String, required: true},
  state: {type: String, required: true},
  pincode: {type: String, required: true},
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  profileImage: {
    type: String,
    default: "https://via.placeholder.com/150"
  },
  password: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);