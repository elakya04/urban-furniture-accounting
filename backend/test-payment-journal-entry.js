/**
 * Integration Test Suite: Payment & Journal Entry Endpoints
 * Tests:
 *  - /api/payments (POST, GET all, GET :id, POST :id/confirm, POST :id/cancel)
 *  - /api/journal-entries (POST, GET all, GET :id, POST :id/post)
 *  - End-to-end accounting flow: Payment confirmation -> JournalEntry creation -> Bill status update
 */

import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

import paymentRoutes from "./routes/paymentRoutes.js";
import journalEntryRoutes from "./routes/journalEntryRoutes.js";

// Models for seeding & verification
import COA from "./models/COA.js";
import Journal from "./models/Journal.js";
import JournalEntry from "./models/JournalEntry.js";
import Payment from "./models/Payment.js";
import VendorBill from "./models/VendorBill.js";
import Invoice from "./models/Invoice.js";
import Contact from "./models/Contact.js";
import PurchaseOrder from "./models/PurchaseOrder.js";
import SalesOrder from "./models/SalesOrder.js";
import Product from "./models/Product.js";
import User from "./models/User.js";

dotenv.config();

// ── Terminal Colors ──────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;
const failures = [];

function log(msg) {
  console.log(msg);
}

function sectionHeader(title) {
  log(`\n${BOLD}${CYAN}━━━ ${title} ━━━${RESET}`);
}

function assert(condition, testName, detail = "") {
  if (condition) {
    passed++;
    log(`  ${GREEN}✔ PASS:${RESET} ${testName}`);
  } else {
    failed++;
    const errMsg = detail ? ` - ${detail}` : "";
    log(`  ${RED}✖ FAIL:${RESET} ${testName}${errMsg}`);
    failures.push(`${testName}${errMsg}`);
  }
}

async function request(baseUrl, method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, body: data };
}

async function runTests() {
  log(`${BOLD}====================================================${RESET}`);
  log(`${BOLD}     TESTING: Payment & Journal Entry Endpoints     ${RESET}`);
  log(`${BOLD}====================================================${RESET}`);

  // 1. Setup in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  log(`Connected to MongoMemoryServer: ${uri}`);

  // 2. Setup Express app
  const app = express();
  app.use(express.json());
  app.use("/api/payments", paymentRoutes);
  app.use("/api/journal-entries", journalEntryRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  log(`Test server running on ${baseUrl}`);

  try {
    // ════════════════════════════════════════════════════════════════════
    // SEEDING MASTER DATA
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("Seeding Chart of Accounts, Journals & Master Records");

    // COA Accounts
    const bankAccount = await COA.create({
      accountName: "HDFC Bank Account",
      type: "ASSET",
      isActive: true
    });
    const cashAccount = await COA.create({
      accountName: "Petty Cash Account",
      type: "ASSET",
      isActive: true
    });
    const apAccount = await COA.create({
      accountName: "Accounts Payable",
      type: "LIABILITY",
      isActive: true
    });
    const arAccount = await COA.create({
      accountName: "Accounts Receivable",
      type: "ASSET",
      isActive: true
    });
    const expenseAccount = await COA.create({
      accountName: "Office Supplies Expense",
      type: "EXPENSE",
      isActive: true
    });

    log(`Seeded 5 COA Accounts: Bank, Cash, AP, AR, Expense`);

    // Journals
    // 1. Vendor Payment - Bank (debit: AP, credit: Bank)
    const vendorBankJournal = await Journal.create({
      journalName: "Vendor Payment - Bank",
      type: "BANK",
      def_debitAcc: apAccount._id,
      def_creditAcc: bankAccount._id
    });

    // 2. Vendor Payment - Cash (debit: AP, credit: Cash)
    const vendorCashJournal = await Journal.create({
      journalName: "Vendor Payment - Cash",
      type: "CASH",
      def_debitAcc: apAccount._id,
      def_creditAcc: cashAccount._id
    });

    // 3. Customer Receipt - Bank (debit: Bank, credit: AR)
    const customerBankJournal = await Journal.create({
      journalName: "Customer Receipt - Bank",
      type: "BANK",
      def_debitAcc: bankAccount._id,
      def_creditAcc: arAccount._id
    });

    // 4. Customer Receipt - Cash (debit: Cash, credit: AR)
    const customerCashJournal = await Journal.create({
      journalName: "Customer Receipt - Cash",
      type: "CASH",
      def_debitAcc: cashAccount._id,
      def_creditAcc: arAccount._id
    });

    log(`Seeded 4 Journals for Bank & Cash (Vendor Payments & Customer Receipts)`);

    // Master contacts and users
    const vendorUser = await User.create({
      role: "CONTACT",
      contact_role: "VENDOR",
      isActive: true
    });
    const vendorContact = await Contact.create({
      name: "TimberCraft Suppliers",
      loginId: "timber_01",
      userType: "CONTACT",
      email: "timber@craft.com",
      mobile: 9876543210,
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
      password: "hashedpassword",
      user: vendorUser._id
    });

    // Customer User
    const customerUser = await User.create({
      role: "CONTACT",
      contact_role: "CUSTOMER",
      isActive: true
    });

    const customerContact = await Contact.create({
      name: "Modern Interiors Ltd",
      loginId: "modern_01",
      userType: "CONTACT",
      email: "modern@interiors.com",
      mobile: 9876543211,
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      password: "hashedpassword",
      user: customerUser._id
    });

    // Product & Orders
    const product = await Product.create({
      productName: "Solid Teak Wood Board",
      type: "GOODS",
      salesPrice: 200,
      cost: 120,
      category: "Raw Material"
    });

    const po = await PurchaseOrder.create({
      purchase_id: 5001,
      vendor: vendorContact._id,
      items: [{ product: product._id, quantity: 10, unitPrice: 100, total: 1000 }],
      total_amount: 1000,
      status: "CONFIRMED"
    });

    const vendorBill = await VendorBill.create({
      bill_number: 1001,
      sales: po._id,
      vendor: vendorContact._id,
      total: 1000,
      amount_due: 1000,
      amount_paid: 0,
      due_date: new Date(Date.now() + 7 * 86400000),
      status: "DUE"
    });

    const salesOrder = await SalesOrder.create({
      customer: customerUser._id,
      items: [{ product: product._id, quantity: 5, unitPrice: 200, total: 1000 }],
      total_amount: 1000,
      status: "CONFIRMED"
    });

    const invoice = await Invoice.create({
      invoice_number: 2001,
      sales: salesOrder._id,
      total_amount: 1000,
      amount_due: 1000,
      amount_paid: 0,
      due_date: new Date(Date.now() + 7 * 86400000),
      status: "DUE"
    });

    log(`Seeded PO, VendorBill (#1001, total 1000), SO, and Invoice (#2001, total 1000)`);

    // ════════════════════════════════════════════════════════════════════
    // SECTION 1: JOURNAL ENTRY ENDPOINTS (/api/journal-entries)
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("1. Journal Entry Endpoints (/api/journal-entries)");

    // 1.1 Validation: Missing journal
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journalItems: [
          { account: expenseAccount._id, debit: 100, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: 100 }
        ]
      });
      assert(res.status === 400, "1.1 Missing journal returns HTTP 400");
      assert(res.body?.message === "Journal is required", "1.1 Message is 'Journal is required'");
    }

    // 1.2 Validation: Non-existent journal
    {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: fakeId,
        journalItems: [
          { account: expenseAccount._id, debit: 100, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: 100 }
        ]
      });
      assert(res.status === 404, "1.2 Non-existent journal returns HTTP 404");
      assert(res.body?.message === "Journal not found", "1.2 Message is 'Journal not found'");
    }

    // 1.3 Validation: Missing journalItems
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorBankJournal._id,
        journalItems: []
      });
      assert(res.status === 400, "1.3 Empty journalItems returns HTTP 400");
    }

    // 1.4 Validation: Item missing account
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorBankJournal._id,
        journalItems: [
          { debit: 100, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: 100 }
        ]
      });
      assert(res.status === 400, "1.4 Item missing account returns HTTP 400");
      assert(
        res.body?.message === "Every journal item must have an account",
        "1.4 Message specifies every item must have an account"
      );
    }

    // 1.5 Validation: Non-existent account ID
    {
      const fakeAccount = new mongoose.Types.ObjectId();
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorBankJournal._id,
        journalItems: [
          { account: fakeAccount, debit: 100, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: 100 }
        ]
      });
      assert(res.status === 404, "1.5 Non-existent COA account returns HTTP 404");
    }

    // 1.6 Validation: Negative debit or credit
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorBankJournal._id,
        journalItems: [
          { account: expenseAccount._id, debit: -50, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: -50 }
        ]
      });
      assert(res.status === 400, "1.6 Negative amounts return HTTP 400");
    }

    // 1.7 Validation: Item has both debit and credit
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorBankJournal._id,
        journalItems: [
          { account: expenseAccount._id, debit: 50, credit: 50 },
          { account: cashAccount._id, debit: 0, credit: 100 }
        ]
      });
      assert(res.status === 400, "1.7 Item having both debit and credit returns HTTP 400");
    }

    // 1.8 Validation: Unbalanced double-entry (debit != credit)
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorBankJournal._id,
        journalItems: [
          { account: expenseAccount._id, debit: 200, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: 150 }
        ]
      });
      assert(res.status === 400, "1.8 Unbalanced entry returns HTTP 400");
      assert(
        res.body?.message === "Journal entry is not balanced",
        "1.8 Message is 'Journal entry is not balanced'"
      );
    }

    // 1.9 Success: Create balanced Journal Entry
    let createdJournalEntryId;
    {
      const res = await request(baseUrl, "POST", "/api/journal-entries", {
        journal: vendorCashJournal._id,
        date: new Date(),
        inv_bill: "MISC-001",
        sourceType: "VENDOR_BILL",
        sourceId: vendorBill._id,
        journalItems: [
          { account: expenseAccount._id, debit: 150, credit: 0 },
          { account: cashAccount._id, debit: 0, credit: 150 }
        ]
      });
      if (res.status !== 201) {
        log(`DEBUG 1.9: status=${res.status}, body=${JSON.stringify(res.body)}`);
      }
      assert(res.status === 201, "1.9 Valid journal entry returns HTTP 201", JSON.stringify(res.body));
      assert(res.body?.success === true, "1.9 success is true");
      assert(res.body?.data?.status === "DRAFT", "1.9 Initial status is DRAFT");
      assert(Array.isArray(res.body?.data?.journalItems), "1.9 journalItems is an array");
      assert(res.body?.data?.journalItems?.length === 2, "1.9 Contains 2 items");
      createdJournalEntryId = res.body?.data?._id;
    }

    // 1.10 GET all Journal Entries
    {
      const res = await request(baseUrl, "GET", "/api/journal-entries");
      assert(res.status === 200, "1.10 GET /api/journal-entries returns HTTP 200");
      assert(Array.isArray(res.body?.data), "1.10 Response data is an array");
      assert(res.body.data.length >= 1, "1.10 Array has at least 1 entry");
      assert(!!res.body.data[0].journal, "1.10 Populated journal field");
    }

    // 1.11 GET Journal Entry by ID
    {
      const res = await request(baseUrl, "GET", `/api/journal-entries/${createdJournalEntryId}`);
      assert(res.status === 200, "1.11 GET /api/journal-entries/:id returns HTTP 200");
      assert(res.body?.data?._id === createdJournalEntryId, "1.11 Returned correct ID");
    }

    // 1.12 GET Journal Entry by non-existent ID
    {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(baseUrl, "GET", `/api/journal-entries/${fakeId}`);
      assert(res.status === 404, "1.12 GET with non-existent ID returns HTTP 404");
    }

    // 1.13 POST /:id/post: Post draft journal entry
    {
      const res = await request(baseUrl, "POST", `/api/journal-entries/${createdJournalEntryId}/post`);
      assert(res.status === 200, "1.13 Post journal entry returns HTTP 200");
      assert(res.body?.data?.status === "POSTED", "1.13 Status updated to POSTED");

      // Verify DB
      const dbEntry = await JournalEntry.findById(createdJournalEntryId);
      assert(dbEntry.status === "POSTED", "1.13 Database record status is POSTED");
    }

    // 1.14 Cannot post an already POSTED journal entry
    {
      const res = await request(baseUrl, "POST", `/api/journal-entries/${createdJournalEntryId}/post`);
      assert(res.status === 400, "1.14 Re-posting an already posted entry returns HTTP 400");
      assert(
        res.body?.message === "Only draft journal entries can be posted",
        "1.14 Message is 'Only draft journal entries can be posted'"
      );
    }

    // ════════════════════════════════════════════════════════════════════
    // SECTION 2: PAYMENT ENDPOINTS (/api/payments)
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("2. Payment Endpoints (/api/payments)");

    // 2.1 Validation: Missing required fields
    {
      const res = await request(baseUrl, "POST", "/api/payments", {});
      assert(res.status === 400, "2.1 Missing required fields returns HTTP 400");
      assert(
        res.body?.message === "payment_method, amount and type are required",
        "2.1 Error message indicates missing required fields"
      );
    }

    // 2.2 Validation: Invalid payment method
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BITCOIN",
        amount: 100,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      assert(res.status === 400, "2.2 Invalid payment method returns HTTP 400");
      assert(res.body?.message === "Invalid payment method", "2.2 Message is 'Invalid payment method'");
    }

    // 2.3 Validation: Invalid payment type
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 100,
        type: "TRANSFER",
        vendorbill: vendorBill._id
      });
      assert(res.status === 400, "2.3 Invalid payment type returns HTTP 400");
      assert(res.body?.message === "Invalid payment type", "2.3 Message is 'Invalid payment type'");
    }

    // 2.4 Validation: Amount <= 0
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 0,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      assert(res.status === 400, "2.4 Amount 0 returns HTTP 400");
      assert(
        res.body?.message === "Payment amount must be greater than 0",
        "2.4 Message specifies amount must be greater than 0"
      );
    }

    // 2.5 Validation: RECEIVE without invoiceBill
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 100,
        type: "RECEIVE"
      });
      assert(res.status === 400, "2.5 RECEIVE without invoiceBill returns HTTP 400");
      assert(
        res.body?.message === "A RECEIVE payment must be linked to an invoice",
        "2.5 Message specifies invoice linkage required"
      );
    }

    // 2.6 Validation: RECEIVE with non-existent invoice
    {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 100,
        type: "RECEIVE",
        invoiceBill: fakeId
      });
      assert(res.status === 404, "2.6 RECEIVE with non-existent invoice returns HTTP 404");
    }

    // 2.7 Validation: SEND without vendorbill
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 100,
        type: "SEND"
      });
      assert(res.status === 400, "2.7 SEND without vendorbill returns HTTP 400");
      assert(
        res.body?.message === "A SEND payment must be linked to a vendor bill",
        "2.7 Message specifies vendor bill linkage required"
      );
    }

    // 2.8 Validation: Payment exceeding bill amount
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 5000,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      assert(res.status === 400, "2.8 Payment exceeding remaining bill amount returns HTTP 400");
      assert(
        res.body?.message?.includes("Payment exceeds remaining vendor bill amount"),
        "2.8 Error message indicates payment exceeds remaining amount"
      );
    }

    // 2.9 Create valid SEND payment (Vendor Bill payment)
    let sendPaymentId;
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 400,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      assert(res.status === 201, "2.9 Valid SEND payment returns HTTP 201");
      assert(res.body?.success === true, "2.9 success is true");
      assert(res.body?.data?.status === "DRAFT", "2.9 Status is DRAFT");
      assert(res.body?.data?.amount === 400, "2.9 Amount is 400");
      sendPaymentId = res.body?.data?._id;
    }

    // 2.10 Create valid RECEIVE payment (Customer Invoice payment)
    let receivePaymentId;
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "CASH",
        amount: 500,
        type: "RECEIVE",
        invoiceBill: invoice._id
      });
      assert(res.status === 201, "2.10 Valid RECEIVE payment returns HTTP 201");
      assert(res.body?.data?.status === "DRAFT", "2.10 Status is DRAFT");
      receivePaymentId = res.body?.data?._id;
    }

    // 2.11 GET all payments
    {
      const res = await request(baseUrl, "GET", "/api/payments");
      assert(res.status === 200, "2.11 GET /api/payments returns HTTP 200");
      assert(Array.isArray(res.body?.data), "2.11 Returns array");
      assert(res.body.data.length >= 2, "2.11 Contains both created payments");
    }

    // 2.12 GET payment by ID
    {
      const res = await request(baseUrl, "GET", `/api/payments/${sendPaymentId}`);
      assert(res.status === 200, "2.12 GET /api/payments/:id returns HTTP 200");
      assert(res.body?.data?._id === sendPaymentId, "2.12 Returns correct payment ID");
      assert(!!res.body?.data?.vendorbill, "2.12 Populated vendorbill reference");
    }

    // 2.13 Cancel Payment (Draft payment)
    {
      // Create a temporary payment to cancel
      const tempRes = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "CASH",
        amount: 50,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      const tempId = tempRes.body?.data?._id;

      const cancelRes = await request(baseUrl, "POST", `/api/payments/${tempId}/cancel`);
      assert(cancelRes.status === 200, "2.13 Cancel payment returns HTTP 200");
      assert(cancelRes.body?.data?.status === "CANCEL", "2.13 Payment status is CANCEL");

      // Verify cannot cancel again
      const reCancel = await request(baseUrl, "POST", `/api/payments/${tempId}/cancel`);
      assert(reCancel.status === 400, "2.13 Cannot cancel already cancelled payment (HTTP 400)");
    }

    // ════════════════════════════════════════════════════════════════════
    // SECTION 3: END-TO-END PAYMENT CONFIRMATION & ACCOUNTING
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("3. Confirm Payment & Automated Double-Entry Creation");

    // 3.1 Confirm SEND Payment (400 on VendorBill of 1000)
    {
      const res = await request(baseUrl, "POST", `/api/payments/${sendPaymentId}/confirm`);
      assert(res.status === 200, "3.1 Confirm payment returns HTTP 200");
      assert(res.body?.success === true, "3.1 success is true");
      assert(res.body?.data?.payment?.status === "CONFIRM", "3.1 Payment status is CONFIRM");

      // Check automated JournalEntry created
      const je = res.body?.data?.journalEntry;
      assert(!!je, "3.1 Automated JournalEntry created and returned");
      assert(je?.status === "POSTED", "3.1 Created JournalEntry has status POSTED");
      assert(je?.sourceType === "PAYMENT", "3.1 JournalEntry sourceType is PAYMENT");
      assert(je?.sourceId === sendPaymentId, "3.1 JournalEntry sourceId matches payment ID");

      // Verify double-entry balance on created JE
      const debitItem = je.journalItems.find((i) => i.debit > 0);
      const creditItem = je.journalItems.find((i) => i.credit > 0);
      assert(debitItem?.debit === 400, "3.1 Journal item debit amount is 400");
      assert(creditItem?.credit === 400, "3.1 Journal item credit amount is 400");

      // Check VendorBill updated
      const updatedBill = res.body?.data?.bill;
      assert(updatedBill?.amount_paid === 400, "3.1 Vendor bill amount_paid updated to 400");
      assert(updatedBill?.amount_due === 600, "3.1 Vendor bill amount_due updated to 600");
      assert(updatedBill?.status === "DUE", "3.1 Vendor bill status remains DUE (partial payment)");

      // Verify in DB directly
      const dbBill = await VendorBill.findById(vendorBill._id);
      assert(dbBill.amount_paid === 400 && dbBill.amount_due === 600, "3.1 MongoDB VendorBill matches");
    }

    // 3.2 Confirm RECEIVE Payment (500 on Invoice of 1000)
    {
      const res = await request(baseUrl, "POST", `/api/payments/${receivePaymentId}/confirm`);
      assert(res.status === 200, "3.2 Confirm RECEIVE payment returns HTTP 200");
      assert(res.body?.data?.payment?.status === "CONFIRM", "3.2 Payment status is CONFIRM");

      const je = res.body?.data?.journalEntry;
      assert(!!je, "3.2 JournalEntry created for customer receipt");
      assert(je?.sourceType === "PAYMENT", "3.2 JournalEntry sourceType is PAYMENT");

      const updatedInvoice = res.body?.data?.bill;
      assert(updatedInvoice?.amount_paid === 500, "3.2 Invoice amount_paid is 500");
      assert(updatedInvoice?.amount_due === 500, "3.2 Invoice amount_due is 500");
      assert(updatedInvoice?.status === "DUE", "3.2 Invoice status is DUE (partial)");
    }

    // 3.3 Pay off remaining 600 on VendorBill -> transitions to PAID
    {
      const finalPaymentRes = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 600,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      const finalPaymentId = finalPaymentRes.body?.data?._id;

      const confirmRes = await request(baseUrl, "POST", `/api/payments/${finalPaymentId}/confirm`);
      assert(confirmRes.status === 200, "3.3 Second payment confirmation returns HTTP 200");
      assert(confirmRes.body?.data?.bill?.amount_paid === 1000, "3.3 VendorBill amount_paid is now 1000");
      assert(confirmRes.body?.data?.bill?.amount_due === 0, "3.3 VendorBill amount_due is now 0");
      assert(confirmRes.body?.data?.bill?.status === "PAID", "3.3 VendorBill status transitioned to PAID");

      // Verify DB
      const dbBill = await VendorBill.findById(vendorBill._id);
      assert(dbBill.status === "PAID", "3.3 Database record is PAID");
    }

    // 3.4 Attempt to create payment on fully paid bill -> rejected
    {
      const res = await request(baseUrl, "POST", "/api/payments", {
        payment_method: "BANK",
        amount: 100,
        type: "SEND",
        vendorbill: vendorBill._id
      });
      assert(res.status === 400, "3.4 Payment on fully paid bill is rejected with HTTP 400");
      assert(
        res.body?.message === "Vendor bill is already fully paid",
        "3.4 Message is 'Vendor bill is already fully paid'"
      );
    }

    // 3.5 Attempt to re-confirm already confirmed payment -> rejected
    {
      const res = await request(baseUrl, "POST", `/api/payments/${sendPaymentId}/confirm`);
      assert(res.status === 400, "3.5 Cannot re-confirm already CONFIRM payment (HTTP 400)");
      assert(
        res.body?.message === "Payment cannot be confirmed from CONFIRM state",
        "3.5 Message confirms only DRAFT payments can be confirmed"
      );
    }

    // 3.6 Verify Journal Entries count in DB
    {
      const totalEntries = await JournalEntry.countDocuments();
      assert(totalEntries >= 3, "3.6 Database has all created & automated journal entries (>= 3)");
    }
  } finally {
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
  }

  // ── Final Summary ──────────────────────────────────────────────────
  log(`\n${BOLD}====================================================${RESET}`);
  log(`${BOLD}                   TEST RESULTS                     ${RESET}`);
  log(`${BOLD}====================================================${RESET}`);
  log(`  ${GREEN}Passed: ${passed}${RESET}`);
  log(`  ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`);

  if (failures.length > 0) {
    log(`\n${RED}Failures:${RESET}`);
    failures.forEach((f) => log(`  - ${f}`));
    process.exit(1);
  } else {
    log(`\n${GREEN}${BOLD}🎉 ALL PAYMENT & JOURNAL ENTRY TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an unhandled error:", err);
  process.exit(1);
});
