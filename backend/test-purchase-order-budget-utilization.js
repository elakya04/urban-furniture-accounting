import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { createPurchaseOrder, confirmPurchaseOrder, createVendorBillFromPurchaseOrder } from "./controllers/purchaseOrderController.js";
import { confirmVendorBill } from "./controllers/vendorBillController.js";
import { createPayment, confirmPayment } from "./controllers/paymentController.js";
import { createBudget, confirmBudget, getBudgets } from "./controllers/budgetController.js";
import AnalyticsAccount from "./models/AnalyticsAccount.js";
import Contact from "./models/Contact.js";
import Product from "./models/Product.js";
import Budget from "./models/Budget.js";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
};

const invoke = (handler, body = {}, params = {}) => new Promise((resolve, reject) => {
  const userId = new mongoose.Types.ObjectId();
  const req = { body, params, query: {}, role: "ACCOUNTANT", user: { _id: userId, user_id: userId } };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { resolve({ status: this.statusCode, data }); }
  };
  Promise.resolve(handler(req, res)).catch(reject);
});

const main = async () => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  try {
    const analytic = await AnalyticsAccount.create({ name: "Furniture Project", type: "EXPENSE" });
    const vendorUser = await mongoose.connection.collection("users").insertOne({
      role: "CONTACT", contact_role: "VENDOR", isActive: true
    });
    const vendor = await Contact.create({
      name: "Utilization Test Vendor", loginId: "utilvend", userType: "CONTACT",
      email: "utilization@test.com", mobile: 9000000001, city: "Chennai",
      state: "Tamil Nadu", pincode: "600001", password: "test", user: vendorUser.insertedId
    });
    const product = await Product.create({
      productName: "Utilization Test Desk", type: "GOODS", salesPrice: 1000,
      cost: 1000, category: "Testing"
    });
    const now = new Date();
    const start = new Date(now.getTime() - 86400000).toISOString();
    const end = new Date(now.getTime() + 86400000 * 30).toISOString();

    const budgetRes = await invoke(createBudget, {
      name: "Furniture Project Budget", analyticAccountId: analytic._id,
      type: "EXPENSE", amount: 5000, start_date: start, end_date: end
    });
    assert(budgetRes.status === 201, "budget is created");
    const budgetId = budgetRes.data.budget._id;
    const confirmBudgetRes = await invoke(confirmBudget, {}, { id: budgetId });
    assert(confirmBudgetRes.status === 200, "budget is confirmed");

    const poRes = await invoke(createPurchaseOrder, {
      purchase_id: 990001, vendor: vendor._id,
      items: [{ product: product._id, quantity: 1, unitPrice: 1000, tax: 100, budgetAnalytics: analytic._id }]
    });
    assert(poRes.status === 201 && poRes.data.data.status === "DRAFT", "purchase order is created as DRAFT");
    const poId = poRes.data.data._id;

    const confirmPoRes = await invoke(confirmPurchaseOrder, {}, { id: poId });
    assert(confirmPoRes.status === 200 && confirmPoRes.data.data.status === "CONFIRMED", "purchase order is confirmed");

    const billRes = await invoke(createVendorBillFromPurchaseOrder, {
      bill_number: "UTIL-BILL-001", due_date: end, bill_date: now.toISOString()
    }, { id: poId });
    assert(billRes.status === 201, "vendor bill is created from the confirmed purchase order");
    const billId = billRes.data.data._id;
    const beforePayment = await invoke(getBudgets);
    assert(beforePayment.data.budgets.find(b => String(b._id) === String(budgetId)).achieved_amount === 0, "unpaid vendor bill is not reflected in utilization");

    const confirmBillRes = await invoke(confirmVendorBill, {}, { id: billId });
    assert(confirmBillRes.status === 200 && confirmBillRes.data.data.status === "DUE", "vendor bill is confirmed as DUE");
    const paymentRes = await invoke(createPayment, {
      vendorbill: billId, payment_method: "BANK", amount: 1100, type: "SEND", date: now.toISOString()
    });
    assert(paymentRes.status === 201, "vendor payment is recorded");
    const paymentConfirmRes = await invoke(confirmPayment, {}, { id: paymentRes.data.data._id });
    assert(paymentConfirmRes.status === 200 && paymentConfirmRes.data.data.bill.status === "PAID", "vendor payment is confirmed and bill is PAID");

    const afterPayment = await invoke(getBudgets);
    const achieved = afterPayment.data.budgets.find(b => String(b._id) === String(budgetId)).achieved_amount;
    assert(achieved === 1100, `paid amount is reflected in budget utilization (${achieved})`);
    const persistedBudget = await Budget.findById(budgetId);
    assert(persistedBudget.achieved_amount === 1100, "paid utilization is persisted in MongoDB");
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
};

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});