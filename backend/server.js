import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import authRouter from "./routes/authRoutes.js";
import salesOrderRouter from "./routes/salesOrderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import analyticAccountRoutes from "./routes/analyticAccountRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import vendorBillRoutes from "./routes/vendorBillRoutes.js";
import meVendorBillRoutes from "./routes/meVendorBillRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import journalEntryRoutes from "./routes/journalEntryRoutes.js";


dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/sales-orders", salesOrderRouter);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/products", productRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/analytic-accounts", analyticAccountRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/vendor-bills", vendorBillRoutes);
app.use("/api/me", meVendorBillRoutes);
app.use("/api/contacts", contactRouter);
app.use("/api/payments", paymentRoutes);
app.use("/api/journal-entries", journalEntryRoutes);


const PORT = process.env.PORT;

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined. Create a .env file in the project root with your MongoDB connection string.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Atlas connected");

    app.listen(PORT, () => {
      console.log(`Urban Furniture server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};

startServer();