import dotenv from "dotenv";
import mongoose from "mongoose";
import SalesOrder from "./models/SalesOrder.js";
import Invoice from "./models/Invoice.js";

dotenv.config();

const sampleSalesOrders = [
  {
    so_number: "S00001",
    customerName: "Mr Raj (Acme Corp)",
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
  },
  {
    so_number: "S00002",
    customerName: "Sharma Enterprises",
    date: "2026-01-15",
    total_amount: 48000,
    status: "CONFIRMED",
    items: [
      {
        productName: "Executive Oak Conference Table",
        quantity: 1,
        unitPrice: 40000,
        tax: 8000,
        total: 48000,
        account: "coa_8",
        budgetAnalytics: "an_1"
      }
    ]
  },
  {
    so_number: "S00003",
    customerName: "GreenTech Solutions",
    date: "2026-01-20",
    total_amount: 15500,
    status: "DRAFT",
    items: [
      {
        productName: "Modular Workstation Desk",
        quantity: 3,
        unitPrice: 4500,
        tax: 2000,
        total: 15500,
        account: "coa_8",
        budgetAnalytics: "an_2"
      }
    ]
  }
];

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas for seeding...");

    // Clear existing SalesOrders and Invoices
    await SalesOrder.deleteMany({});
    await Invoice.deleteMany({});
    console.log("Cleared existing Sales Orders and Invoices collections.");

    const createdOrders = await SalesOrder.insertMany(sampleSalesOrders);
    console.log(`Successfully seeded ${createdOrders.length} test Sales Orders!`);

    // Create an initial invoice for the INVOICE status order
    const invoiceOrder = createdOrders.find(o => o.status === "INVOICE");
    if (invoiceOrder) {
      await Invoice.deleteMany({ sales: invoiceOrder._id });
      await Invoice.create({
        inv_number: "INV/2026/0001",
        sales: invoiceOrder._id,
        customerName: invoiceOrder.customerName,
        invoice_date: invoiceOrder.date,
        due_date: "2026-02-10",
        total_amount: invoiceOrder.total_amount,
        amount_paid: 25000,
        amount_due: 0,
        status: "PAID",
        items: invoiceOrder.items
      });
      console.log("Seeded linked sample Invoice INV/2026/0001.");
    }

    console.log("\nSample Test Cases Created:");
    createdOrders.forEach(o => {
      console.log(`- [${o.status}] ${o.so_number}: ${o.customerName} - Rs. ${o.total_amount} (ID: ${o._id})`);
    });

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
}

seed();
