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
import invoiceRoutes from "./routes/invoiceRoutes.js";
import ledgerRoutes from "./routes/ledgerRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import requestLogger from "./middleware/logger.js";


dotenv.config();

const app = express();

app.use(express.json());
app.use(requestLogger);
app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  return res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "UP" : "DOWN",
    timestamp: new Date().toISOString(),
    service: "urban-furniture-accounting",
    uptime_seconds: Math.floor(process.uptime()),
    database: isDbConnected ? "CONNECTED" : "DISCONNECTED"
  });
});

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
app.use("/api/payment", paymentRoutes);
app.use("/api/journal-entries", journalEntryRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 Route Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "error",
    service: "urban-furniture-backend",
    log_type: "uncaught_exception",
    request_id: req.id || null,
    method: req.method,
    url: req.originalUrl,
    status_code: statusCode,
    error: err.message,
    stack: err.stack
  }));

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

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