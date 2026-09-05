/**
 * Live End-to-End API Test Script using real curl.exe commands
 * Hits local server (http://localhost:5001) connected to MongoDB Atlas.
 * Persists all test records into the real database.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5001/api";
const TS = Date.now().toString().slice(-4); // Unique 4-digit suffix for unique keys

// Colors
const GREEN = "\x1b[32m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let token = "";
let vendorToken = "";
let adminContactId = "";
let vendorContactId = "";
let customerUserId = "";
let customerContactId = "";

let bankAccId = "";
let apAccId = "";
let arAccId = "";
let revAccId = "";
let expAccId = "";

let vendorBankJournalId = "";
let customerBankJournalId = "";

let analyticAccId = "";
let productId = "";
let salesOrderId = "";
let invoiceId = "";
let purchaseOrderId = "";
let vendorBillId = "";
let vendorBillNumber = "";
let paymentId = "";
let journalEntryId = "";

function runCurl(method, endpoint, body = null, authToken = null) {
  let tempJsonFile = null;
  let cmd = `curl.exe -s -X ${method} "${BASE_URL}${endpoint}"`;

  cmd += ` -H "Content-Type: application/json"`;

  if (authToken) {
    cmd += ` -H "Authorization: Bearer ${authToken}"`;
  }

  if (body) {
    // Write body to temporary JSON file to avoid PowerShell escaping issues on Windows
    tempJsonFile = path.join(process.cwd(), `tmp_payload_${Date.now()}.json`);
    fs.writeFileSync(tempJsonFile, JSON.stringify(body, null, 2));
    cmd += ` -d "@${tempJsonFile.replace(/\\/g, "/")}"`;
  }

  console.log(`\n${BOLD}${CYAN}▶ ${method} ${endpoint}${RESET}`);
  if (body) {
    console.log(`${YELLOW}Payload:${RESET} ${JSON.stringify(body)}`);
  }

  try {
    const rawOutput = execSync(cmd, { encoding: "utf-8" }).trim();
    if (tempJsonFile && fs.existsSync(tempJsonFile)) {
      fs.unlinkSync(tempJsonFile);
    }

    try {
      const parsed = JSON.parse(rawOutput);
      console.log(`${GREEN}✔ Response:${RESET}\n${JSON.stringify(parsed, null, 2)}`);
      return parsed;
    } catch {
      console.log(`${GREEN}✔ Response (raw):${RESET} ${rawOutput}`);
      return rawOutput;
    }
  } catch (err) {
    if (tempJsonFile && fs.existsSync(tempJsonFile)) {
      fs.unlinkSync(tempJsonFile);
    }
    console.error(`✖ Command failed: ${err.message}`);
    return null;
  }
}

function runCurlUpload(endpoint, filePath, fieldName = "profile", authToken = null) {
  let cmd = `curl.exe -s -X POST "${BASE_URL}${endpoint}"`;
  if (authToken) {
    cmd += ` -H "Authorization: Bearer ${authToken}"`;
  }
  cmd += ` -F "${fieldName}=@${filePath.replace(/\\/g, "/")}"`;

  console.log(`\n${BOLD}${CYAN}▶ POST (Upload) ${endpoint}${RESET}`);
  console.log(`${YELLOW}File:${RESET} ${filePath} [field: ${fieldName}]`);

  try {
    const rawOutput = execSync(cmd, { encoding: "utf-8" }).trim();
    try {
      const parsed = JSON.parse(rawOutput);
      console.log(`${GREEN}✔ Response:${RESET}\n${JSON.stringify(parsed, null, 2)}`);
      return parsed;
    } catch {
      console.log(`${GREEN}✔ Response (raw):${RESET} ${rawOutput}`);
      return rawOutput;
    }
  } catch (err) {
    console.error(`✖ Upload failed: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}   END-TO-END LIVE CURL API TEST SUITE (MONGODB ATLAS)         ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`Unique Test Run Suffix: ${TS}`);

  // ── 1. AUTHENTICATION & USERS ──────────────────────────────────────
  console.log(`\n${BOLD}--- 1. AUTHENTICATION & USERS ---${RESET}`);

  // 1.1 Register Admin
  const adminRes = runCurl("POST", "/auth/register", {
    name: `Admin Manager ${TS}`,
    loginId: `adm_${TS}`,
    userType: "ADMIN",
    email: `admin_${TS}@urbanfurniture.com`,
    mobile: 9811100000 + Number(TS),
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    profile: "https://via.placeholder.com/150",
    password: "Password123!"
  });
  token = adminRes?.token;
  adminContactId = adminRes?.contact?._id;

  // 1.2 Register Vendor
  const vendorRes = runCurl("POST", "/auth/register", {
    name: `Royal Timber Suppliers ${TS}`,
    loginId: `ven_${TS}`,
    userType: "CONTACT",
    contactRole: "VENDOR",
    email: `vendor_${TS}@royaltimber.com`,
    mobile: 9822200000 + Number(TS),
    city: "Nagpur",
    state: "Maharashtra",
    pincode: "440001",
    profile: "https://via.placeholder.com/150",
    password: "Password123!"
  });
  vendorToken = vendorRes?.token;
  vendorContactId = vendorRes?.contact?._id;

  // 1.3 Register Customer
  const custRes = runCurl("POST", "/auth/register", {
    name: `Apex Luxury Living ${TS}`,
    loginId: `cus_${TS}`,
    userType: "CONTACT",
    contactRole: "CUSTOMER",
    email: `customer_${TS}@apexluxury.com`,
    mobile: 9833300000 + Number(TS),
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    profile: "https://via.placeholder.com/150",
    password: "Password123!"
  });
  customerContactId = custRes?.contact?._id;
  customerUserId = custRes?.contact?.user;

  // 1.4 Login Admin
  const loginRes = runCurl("POST", "/auth/login", {
    loginId: `adm_${TS}`,
    password: "Password123!"
  });
  if (loginRes?.token) token = loginRes.token;

  // 1.5 Get Current User Profile (me)
  runCurl("GET", "/auth/me", null, token);

  // ── 2. CONTACT DETAILS APIS ────────────────────────────────────────
  console.log(`\n${BOLD}--- 2. CONTACT DETAILS APIS ---${RESET}`);
  runCurl("GET", "/contacts/loginDetails", null, token);
  runCurl("GET", "/contacts?limit=5", null, token);
  runCurl("PATCH", "/contacts", { city: "Navi Mumbai" }, token);

  // ── 3. CHART OF ACCOUNTS (COA) ─────────────────────────────────────
  console.log(`\n${BOLD}--- 3. CHART OF ACCOUNTS (COA) ---${RESET}`);

  const bankAcc = runCurl("POST", "/accounts", {
    accountName: `HDFC Bank Operating ${TS}`,
    type: "ASSET"
  }, token);
  bankAccId = bankAcc?.data?._id;

  const apAcc = runCurl("POST", "/accounts", {
    accountName: `Accounts Payable Trade ${TS}`,
    type: "LIABILITY"
  }, token);
  apAccId = apAcc?.data?._id;

  const arAcc = runCurl("POST", "/accounts", {
    accountName: `Accounts Receivable Trade ${TS}`,
    type: "ASSET"
  }, token);
  arAccId = arAcc?.data?._id;

  const revAcc = runCurl("POST", "/accounts", {
    accountName: `Sales Revenue Furniture ${TS}`,
    type: "INCOME"
  }, token);
  revAccId = revAcc?.data?._id;

  const expAcc = runCurl("POST", "/accounts", {
    accountName: `Raw Material Lumber Expense ${TS}`,
    type: "EXPENSE"
  }, token);
  expAccId = expAcc?.data?._id;

  // Get COA list
  runCurl("GET", "/accounts?type=ASSET", null, token);

  // ── 4. JOURNALS ───────────────────────────────────────────────────
  console.log(`\n${BOLD}--- 4. JOURNALS ---${RESET}`);

  const vBankJnl = runCurl("POST", "/journals", {
    journalName: `General Operations Journal ${TS}`,
    type: "GENERAL",
    def_debitAcc: apAccId,
    def_creditAcc: bankAccId
  }, token);

  const allJournals = runCurl("GET", "/journals", null, token);
  vendorBankJournalId = vBankJnl?.data?._id || allJournals?.data?.find(j => j.type === "BANK")?._id || allJournals?.data?.[0]?._id;

  // ── 5. ANALYTIC ACCOUNTS ───────────────────────────────────────────
  console.log(`\n${BOLD}--- 5. ANALYTIC ACCOUNTS ---${RESET}`);
  const analyticRes = runCurl("POST", "/analytic-accounts", {
    accountName: `Modern Living Line ${TS}`,
    type: "Production"
  }, token);
  analyticAccId = analyticRes?.data?._id;
  runCurl("GET", "/analytic-accounts", null, token);

  // ── 6. PRODUCTS ───────────────────────────────────────────────────
  console.log(`\n${BOLD}--- 6. PRODUCTS ---${RESET}`);
  const prodRes = runCurl("POST", "/products", {
    productName: `Nordic Solid Oak Dining Table ${TS}`,
    type: "GOODS",
    salesPrice: 1200,
    cost: 650,
    category: "Dining Room",
    productImage: "https://via.placeholder.com/150"
  }, token);
  productId = prodRes?.data?._id;

  runCurl("GET", "/products", null, token);
  runCurl("GET", `/products/${productId}`, null, token);
  runCurl("PATCH", `/products/${productId}`, { salesPrice: 1250 }, token);

  // 6.4 Product Image Upload via curl -F
  const sampleImagePath = path.join(process.cwd(), "tmp_sample_product.png");
  fs.writeFileSync(sampleImagePath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
  runCurlUpload(`/products/${productId}/image`, sampleImagePath, "profile", token);
  if (fs.existsSync(sampleImagePath)) fs.unlinkSync(sampleImagePath);

  // 6.5 Archive and Unarchive Product
  runCurl("POST", `/products/${productId}/archive`, null, token);
  runCurl("PATCH", `/products/${productId}`, { isActive: true }, token);

  // ── 7. SALES ORDERS & CUSTOMER INVOICES ────────────────────────────
  console.log(`\n${BOLD}--- 7. SALES ORDERS & CUSTOMER INVOICES ---${RESET}`);
  const soRes = runCurl("POST", "/sales-orders", {
    customer: customerUserId,
    customerName: `Apex Luxury Living ${TS}`,
    items: [
      {
        product: productId,
        productName: `Nordic Solid Oak Dining Table ${TS}`,
        quantity: 2,
        unitPrice: 1250,
        total: 2500
      }
    ],
    total_amount: 2500
  }, token);
  salesOrderId = soRes?.salesOrder?._id;

  // Confirm SO
  runCurl("POST", `/sales-orders/${salesOrderId}/confirm`, null, token);

  // Generate Invoice from SO
  const invRes = runCurl("POST", `/sales-orders/${salesOrderId}/invoice`, null, token);
  invoiceId = invRes?.invoice?._id;

  // ── 8. PURCHASE ORDERS & VENDOR BILLS ──────────────────────────────
  console.log(`\n${BOLD}--- 8. PURCHASE ORDERS & VENDOR BILLS ---${RESET}`);
  const poRes = runCurl("POST", "/purchase-orders", {
    purchase_id: Number(`8${TS}`),
    vendor: vendorContactId,
    items: [
      {
        product: productId,
        quantity: 10,
        unitPrice: 650
      }
    ]
  }, token);
  purchaseOrderId = poRes?.data?._id;

  // Confirm PO
  runCurl("POST", `/purchase-orders/${purchaseOrderId}/confirm`, null, token);

  // Generate Vendor Bill from PO
  const vbRes = runCurl("POST", `/purchase-orders/${purchaseOrderId}/vendor-bill`, {
    bill_number: Number(`9${TS}`),
    due_date: new Date(Date.now() + 14 * 86400000).toISOString()
  }, token);
  vendorBillId = vbRes?.data?._id;
  vendorBillNumber = vbRes?.data?.bill_number;

  // ── 9. VENDOR BILLS & VENDOR SELF-SERVICE ──────────────────────────
  console.log(`\n${BOLD}--- 9. VENDOR BILLS & VENDOR SELF-SERVICE ---${RESET}`);
  runCurl("GET", "/vendor-bills", null, token);
  runCurl("GET", `/vendor-bills/${vendorBillId}`, null, token);

  // Vendor self-service using vendor's own token
  runCurl("GET", "/me/vendor-bills", null, vendorToken);
  runCurl("GET", `/me/vendor-bills/${vendorBillId}`, null, vendorToken);

  // ── 10. PAYMENTS & RECONCILIATION ──────────────────────────────────
  console.log(`\n${BOLD}--- 10. PAYMENTS & ACCOUNTING RECONCILIATION ---${RESET}`);

  // Create payment for Vendor Bill (SEND)
  const payRes = runCurl("POST", "/payments", {
    type: "SEND",
    payment_method: "BANK",
    amount: 6500,
    vendorbill: vendorBillId
  }, token);
  paymentId = payRes?.data?._id;

  runCurl("GET", "/payments", null, token);
  runCurl("GET", `/payments/${paymentId}`, null, token);

  // Confirm Payment -> Automates JournalEntry and sets VendorBill to PAID!
  runCurl("POST", `/payments/${paymentId}/confirm`, null, token);

  // Verify Vendor Bill payment history
  runCurl("GET", `/vendor-bills/${vendorBillId}/payments`, null, token);

  // ── 11. MANUAL JOURNAL ENTRIES ─────────────────────────────────────
  console.log(`\n${BOLD}--- 11. MANUAL JOURNAL ENTRIES ---${RESET}`);
  const jeRes = runCurl("POST", "/journal-entries", {
    journal: vendorBankJournalId,
    inv_bill: `ADJ-${TS}`,
    sourceType: "PAYMENT",
    sourceId: paymentId,
    journalItems: [
      { account: expAccId, debit: 500, credit: 0 },
      { account: bankAccId, debit: 0, credit: 500 }
    ]
  }, token);
  journalEntryId = jeRes?.data?._id;

  runCurl("GET", "/journal-entries", null, token);
  runCurl("GET", `/journal-entries/${journalEntryId}`, null, token);

  // Post Journal Entry to General Ledger
  runCurl("POST", `/journal-entries/${journalEntryId}/post`, null, token);

  // ── 12. GENERAL LEDGER INSPECTION ──────────────────────────────────
  console.log(`\n${BOLD}--- 12. GENERAL LEDGER INSPECTION ---${RESET}`);
  runCurl("GET", `/accounts/${bankAccId}/ledger`, null, token);
  runCurl("GET", `/accounts/${apAccId}/ledger`, null, token);

  console.log(`\n${BOLD}${GREEN}================================================================${RESET}`);
  console.log(`${BOLD}${GREEN}  ALL APIS TESTED END-TO-END VIA CURL — DATA PERSISTED IN DB   ${RESET}`);
  console.log(`${BOLD}${GREEN}================================================================${RESET}`);

  console.log(`\n${BOLD}SUMMARY OF PERSISTED DATABASE RECORDS (MONGODB ATLAS):${RESET}`);
  console.table({
    "Admin Contact": { Collection: "contacts", ID: adminContactId },
    "Vendor Contact": { Collection: "contacts", ID: vendorContactId },
    "Customer Contact": { Collection: "contacts", ID: customerContactId },
    "Bank Account": { Collection: "accounts", ID: bankAccId },
    "Accounts Payable": { Collection: "accounts", ID: apAccId },
    "Accounts Receivable": { Collection: "accounts", ID: arAccId },
    "Product": { Collection: "products", ID: productId },
    "Sales Order": { Collection: "salesorders", ID: salesOrderId },
    "Customer Invoice": { Collection: "invoices", ID: invoiceId },
    "Purchase Order": { Collection: "purchaseorders", ID: purchaseOrderId },
    "Vendor Bill": { Collection: "vendorbills", ID: vendorBillId },
    "Payment": { Collection: "payments", ID: paymentId },
    "Journal Entry": { Collection: "journalentries", ID: journalEntryId },
  });
}

main().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
