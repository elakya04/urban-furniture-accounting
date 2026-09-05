import dotenv from "dotenv";
import mongoose from "mongoose";
import SalesOrder from "./models/SalesOrder.js";
import Invoice from "./models/Invoice.js";
import Payment from "./models/Payment.js";

dotenv.config();

// Seed exactly ONE single clean verification record
const sampleSalesOrder = {
  so_number: "S00001",
  customerName: "Acme Urban Furniture",
  date: "2026-01-10",
  total_amount: 25000,
  status: "INVOICE",
  items: [
    {
      productName: "Ergonomic Office Chair",
      quantity: 2,
      unitPrice: 10500,
      tax: 4000,
      total: 25000,
      account: "coa_8",
      budgetAnalytics: "an_3"
    }
  ]
};

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas for single-record verification seed...");

    // Clear all existing collections
    await SalesOrder.deleteMany({});
    await Invoice.deleteMany({});
    await Payment.deleteMany({});
    console.log("Cleared all existing Sales Orders, Invoices, and Payments.");

    // Insert single verification Sales Order
    const createdOrder = await SalesOrder.create(sampleSalesOrder);
    console.log(`Created 1 verification Sales Order: ${createdOrder.so_number}`);

    // Insert single verification Invoice linked to the Sales Order
    const createdInvoice = await Invoice.create({
      inv_number: "INV/2026/0001",
      sales: createdOrder._id,
      customerName: createdOrder.customerName,
      invoice_date: createdOrder.date,
      due_date: "2026-02-10",
      total_amount: createdOrder.total_amount,
      amount_paid: 25000,
      amount_due: 0,
      status: "PAID",
      items: createdOrder.items
    });
    console.log(`Created 1 verification Invoice: ${createdInvoice.inv_number}`);

    // Insert single verification Payment linked to the Invoice
    const createdPayment = await Payment.create({
      invoiceBill: createdInvoice._id,
      payment_method: "BANK",
      amount: 25000,
      status: "CONFIRM",
      type: "RECEIVE",
      date: "2026-01-12"
    });
    console.log(`Created 1 verification Payment of Rs. ${createdPayment.amount}`);

    console.log("\nSingle Record Verification Data Created Successfully!");
    console.log(`- Sales Order: ${createdOrder.so_number} (ID: ${createdOrder._id})`);
    console.log(`- Invoice: ${createdInvoice.inv_number} (ID: ${createdInvoice._id})`);
    console.log(`- Payment: Rs. ${createdPayment.amount} (ID: ${createdPayment._id})`);

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

seed();
