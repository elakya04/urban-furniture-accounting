import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";
import authRouter from "./routes/authRoutes.js";


dotenv.config();

const app = express();

app.use(express.json());
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