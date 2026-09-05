import express from "express";

import productRoutes from "./routes/productRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import analyticAccountRoutes from "./routes/analyticAccountRoutes.js";

const app = express();

app.use(express.json());

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