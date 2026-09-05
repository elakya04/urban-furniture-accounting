<<<<<<< HEAD
import express from "express";

import productRoutes from "./routes/productRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import analyticAccountRoutes from "./routes/analyticAccountRoutes.js";
=======
import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import authRouter from "./routes/authRoutes.js";


dotenv.config();
>>>>>>> 411df41f10cc89e2464b040a6887eddbaa07b2ae

const app = express();

app.use(express.json());
<<<<<<< HEAD

// Routes
app.use("/api/products", productRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/analytic-accounts", analyticAccountRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/vendor-bills", vendorBillRoutes);
app.use("/api/me", meVendorBillRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
=======
app.use("/api/auth",authRouter);

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
>>>>>>> 411df41f10cc89e2464b040a6887eddbaa07b2ae
