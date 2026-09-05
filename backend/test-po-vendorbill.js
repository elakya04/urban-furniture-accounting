/**
 * Purchase Order & Vendor Bill — Endpoint Integration Tests
 * Uses mongodb-memory-server (no external DB required).
 *
 * NOTE: The Contact model's userType enum is ["ACCOUNTANT","CONTACT","ADMIN"],
 * but purchaseOrderController checks for ["VENDOR","BOTH"]. This test seeds
 * Contact directly (bypassing validation) to match the controller logic, and
 * flags this mismatch.
 */

import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";

// ── Import routes ────────────────────────────────────────────────
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import vendorBillRoutes from "./routes/vendorBillRoutes.js";
import meVendorBillRoutes from "./routes/meVendorBillRoutes.js";

// ── Import models for seeding ────────────────────────────────────
import Contact from "./models/Contact.js";
import Product from "./models/Product.js";
import Payment from "./models/Payment.js";
import User from "./models/User.js";

// ── Colours ──────────────────────────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

// ── Helpers ──────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function log(msg) {
  console.log(msg);
}

function sectionHeader(title) {
  log(`\n${BOLD}${CYAN}━━━ ${title} ━━━${RESET}`);
}

async function request(port, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port,
      path,
      method,
      headers: { "Content-Type": "application/json" }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          // PDF endpoint returns binary, not JSON
          resolve({ status: res.statusCode, body: data, raw: true });
        }
      });
    });

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(testName, condition, actual) {
  if (condition) {
    passed++;
    log(`  ${GREEN}✔ PASS${RESET} — ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    log(`  ${RED}✘ FAIL${RESET} — ${testName}  ${DIM}(got: ${JSON.stringify(actual)})${RESET}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  log(`${BOLD}${CYAN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  log(`${BOLD}${CYAN}║  Purchase Order & Vendor Bill — Integration Tests         ║${RESET}`);
  log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════════════╝${RESET}`);

  // 1. Start in-memory MongoDB
  log(`\n${YELLOW}▸ Starting in-memory MongoDB...${RESET}`);
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  log(`${GREEN}▸ Connected to in-memory MongoDB${RESET}`);

  // 2. Create Express app
  const app = express();
  app.use(express.json());

  // Fake auth middleware for /api/me routes (simulates req.user)
  let fakeUser = null;
  app.use("/api/me", (req, res, next) => {
    if (fakeUser) {
      req.user = fakeUser;
    }
    next();
  });

  app.use("/api/purchase-orders", purchaseOrderRoutes);
  app.use("/api/vendor-bills", vendorBillRoutes);
  app.use("/api/me", meVendorBillRoutes);

  const server = app.listen(0);
  const port = server.address().port;
  log(`${GREEN}▸ Server running on port ${port}${RESET}`);

  // ── SEED TEST DATA ─────────────────────────────────────────────
  log(`\n${YELLOW}▸ Seeding test data...${RESET}`);

  // Create a User with contact_role: VENDOR and link it to a Contact
  const vendorUser = await User.create({
    role: "CONTACT",
    contact_role: "VENDOR",
    isActive: true
  });

  const vendorContact = await Contact.create({
    name: "Test Vendor Co",
    loginId: "vendor001",
    userType: "CONTACT",
    email: "vendor@test.com",
    mobile: 9876543210,
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600001",
    password: "hashedpass123",
    user: vendorUser._id
  });
  const vendorId = vendorContact._id.toString();

  // Create a non-vendor User (CUSTOMER) linked to a Contact
  const customerUser = await User.create({
    role: "CONTACT",
    contact_role: "CUSTOMER",
    isActive: true
  });

  const nonVendorContact = await Contact.create({
    name: "Regular Customer",
    loginId: "cust000001",
    userType: "CONTACT",
    email: "customer@test.com",
    mobile: 9876543211,
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    password: "hashedpass456",
    user: customerUser._id
  });
  const nonVendorId = nonVendorContact._id.toString();

  // Create test products
  const product1 = await Product.create({
    productName: "Office Desk",
    type: "GOODS",
    salesPrice: 300,
    cost: 150,
    category: "Desks"
  });

  const product2 = await Product.create({
    productName: "Office Chair",
    type: "GOODS",
    salesPrice: 200,
    cost: 100,
    category: "Chairs"
  });

  log(`${GREEN}▸ Seeded: 1 vendor contact, 1 customer contact, 2 users, 2 products${RESET}`);

  // ── Track IDs ──────────────────────────────────────────────────
  let poId, poId2, vendorBillId;

  // ═══════════════════════════════════════════════════════════════
  //  1. PURCHASE ORDER CONTROLLER
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("1. Purchase Order Controller (/api/purchase-orders)");

  // 1a. Create PO — missing required fields → 400
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001
    });
    assert("POST — missing vendor & items → 400", r.status === 400, r.status);
  }

  // 1b. Create PO — invalid vendor (non-vendor contact_role=CUSTOMER) → 400
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001,
      vendor: nonVendorId,
      items: [{ product: product1._id.toString(), quantity: 2, unitPrice: 150 }]
    });
    assert("POST — non-vendor contact → 400", r.status === 400, r.status);
  }

  // 1c. Create PO — invalid product → 400
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001,
      vendor: vendorId,
      items: [{ product: "bad-id", quantity: 2, unitPrice: 150 }]
    });
    assert("POST — invalid product ID → 400", r.status === 400, r.status);
  }

  // 1d. Create PO — non-existent product → 404
  {
    const fakeProductId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001,
      vendor: vendorId,
      items: [{ product: fakeProductId, quantity: 2, unitPrice: 150 }]
    });
    assert("POST — non-existent product → 404", r.status === 404, r.status);
  }

  // 1e. Create PO — bad quantity → 400
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001,
      vendor: vendorId,
      items: [{ product: product1._id.toString(), quantity: 0, unitPrice: 150 }]
    });
    assert("POST — quantity=0 → 400", r.status === 400, r.status);
  }

  // 1f. Create PO — bad unitPrice → 400
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001,
      vendor: vendorId,
      items: [{ product: product1._id.toString(), quantity: 2, unitPrice: -1 }]
    });
    assert("POST — negative unitPrice → 400", r.status === 400, r.status);
  }

  // 1g. Create PO — valid → 201
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1001,
      vendor: vendorId,
      items: [
        { product: product1._id.toString(), quantity: 2, unitPrice: 150, tax: 10 },
        { product: product2._id.toString(), quantity: 5, unitPrice: 100, tax: 20 }
      ]
    });
    assert("POST — valid PO → 201", r.status === 201, r.status);
    assert("POST — success=true", r.body.success === true, r.body.success);
    assert("POST — has data._id", !!r.body.data?._id, r.body.data?._id);
    assert("POST — status=DRAFT", r.body.data?.status === "DRAFT", r.body.data?.status);
    assert("POST — total calculated", r.body.data?.total_amount === (2*150+10 + 5*100+20), r.body.data?.total_amount);
    assert("POST — vendor populated", !!r.body.data?.vendor?.name, r.body.data?.vendor);
    assert("POST — items.product populated", !!r.body.data?.items?.[0]?.product?.productName, r.body.data?.items?.[0]?.product);
    poId = r.body.data?._id;
  }

  // 1h. Get all POs → 200
  {
    const r = await request(port, "GET", "/api/purchase-orders");
    assert("GET  / — status 200", r.status === 200, r.status);
    assert("GET  / — returns array", Array.isArray(r.body.data), r.body.data);
    assert("GET  / — has 1 PO", r.body.data?.length === 1, r.body.data?.length);
  }

  // 1i. Get PO by ID → 200
  {
    const r = await request(port, "GET", `/api/purchase-orders/${poId}`);
    assert("GET  /:id — status 200", r.status === 200, r.status);
    assert("GET  /:id — correct purchase_id", r.body.data?.purchase_id === 1001, r.body.data?.purchase_id);
  }

  // 1j. Get PO by bad ID → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "GET", `/api/purchase-orders/${fakeId}`);
    assert("GET  /:badId — 404", r.status === 404, r.status);
  }

  // 1k. Update DRAFT PO → 200
  {
    const r = await request(port, "PATCH", `/api/purchase-orders/${poId}`, {
      total_amount: 999
    });
    assert("PATCH /:id — update draft → 200", r.status === 200, r.status);
    assert("PATCH /:id — total updated", r.body.data?.total_amount === 999, r.body.data?.total_amount);
  }

  // 1l. Confirm PO → 200
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId}/confirm`);
    assert("POST  /:id/confirm — 200", r.status === 200, r.status);
    assert("POST  /:id/confirm — status=CONFIRMED", r.body.data?.status === "CONFIRMED", r.body.data?.status);
  }

  // 1m. Confirm already confirmed PO → 400
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId}/confirm`);
    assert("POST  /:id/confirm — already confirmed → 400", r.status === 400, r.status);
  }

  // 1n. Update CONFIRMED PO → 400 (only DRAFT can be updated)
  {
    const r = await request(port, "PATCH", `/api/purchase-orders/${poId}`, {
      total_amount: 500
    });
    assert("PATCH /:id — update confirmed → 400", r.status === 400, r.status);
  }

  // Create a 2nd PO to test cancel flow
  {
    const r = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1002,
      vendor: vendorId,
      items: [{ product: product1._id.toString(), quantity: 1, unitPrice: 200 }]
    });
    poId2 = r.body.data?._id;
  }

  // 1o. Cancel DRAFT PO → 200
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId2}/cancel`);
    assert("POST  /:id/cancel — cancel draft → 200", r.status === 200, r.status);
    assert("POST  /:id/cancel — status=CANCELLED", r.body.data?.status === "CANCELLED", r.body.data?.status);
  }

  // 1p. Cancel already cancelled PO → 400
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId2}/cancel`);
    assert("POST  /:id/cancel — already cancelled → 400", r.status === 400, r.status);
  }

  // 1q. Cancel non-existent PO → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "POST", `/api/purchase-orders/${fakeId}/cancel`);
    assert("POST  /:fakeId/cancel — 404", r.status === 404, r.status);
  }

  // ═══════════════════════════════════════════════════════════════
  //  2. CREATE VENDOR BILL FROM PURCHASE ORDER
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("2. Create Vendor Bill from PO (/:id/vendor-bill)");

  // 2a. Create bill from DRAFT PO → 400 (need CONFIRMED)
  {
    // Create a new draft PO
    const draft = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1003,
      vendor: vendorId,
      items: [{ product: product1._id.toString(), quantity: 1, unitPrice: 100 }]
    });
    const draftId = draft.body.data?._id;

    const r = await request(port, "POST", `/api/purchase-orders/${draftId}/vendor-bill`, {
      bill_number: 5001,
      due_date: "2026-10-01"
    });
    assert("POST /:id/vendor-bill — draft PO → 400", r.status === 400, r.status);
  }

  // 2b. Create bill — missing required fields → 400
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId}/vendor-bill`, {
      bill_number: 5001
    });
    assert("POST /:id/vendor-bill — missing due_date → 400", r.status === 400, r.status);
  }

  // 2c. Create bill from confirmed PO → 201
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId}/vendor-bill`, {
      bill_number: 5001,
      due_date: "2026-10-01"
    });
    assert("POST /:id/vendor-bill — valid → 201", r.status === 201, r.status);
    assert("POST /:id/vendor-bill — success=true", r.body.success === true, r.body.success);
    assert("POST /:id/vendor-bill — status=DUE", r.body.data?.status === "DUE", r.body.data?.status);
    assert("POST /:id/vendor-bill — vendor populated", !!r.body.data?.vendor?.name, r.body.data?.vendor);
    assert("POST /:id/vendor-bill — sales populated", !!r.body.data?.sales, r.body.data?.sales);
    vendorBillId = r.body.data?._id;
  }

  // 2d. Create duplicate bill for same PO → 400
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId}/vendor-bill`, {
      bill_number: 5002,
      due_date: "2026-10-15"
    });
    assert("POST /:id/vendor-bill — duplicate → 400", r.status === 400, r.status);
  }

  // 2e. Cancel PO that has a vendor bill → 400
  {
    const r = await request(port, "POST", `/api/purchase-orders/${poId}/cancel`);
    assert("POST /:id/cancel — has bill → 400", r.status === 400, r.status);
  }

  // ═══════════════════════════════════════════════════════════════
  //  3. VENDOR BILL CONTROLLER
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("3. Vendor Bill Controller (/api/vendor-bills)");

  // 3a. Get all vendor bills → 200
  {
    const r = await request(port, "GET", "/api/vendor-bills");
    assert("GET  / — status 200", r.status === 200, r.status);
    assert("GET  / — returns array", Array.isArray(r.body.data), r.body.data);
    assert("GET  / — has 1 bill", r.body.data?.length === 1, r.body.data?.length);
  }

  // 3b. Get bill by ID → 200
  {
    const r = await request(port, "GET", `/api/vendor-bills/${vendorBillId}`);
    assert("GET  /:id — 200", r.status === 200, r.status);
    assert("GET  /:id — correct bill_number", r.body.data?.bill_number === 5001, r.body.data?.bill_number);
    assert("GET  /:id — vendor populated", !!r.body.data?.vendor?.name, r.body.data?.vendor);
  }

  // 3c. Get bill by bad ID → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "GET", `/api/vendor-bills/${fakeId}`);
    assert("GET  /:badId — 404", r.status === 404, r.status);
  }

  // 3d. Confirm vendor bill (already DUE → DUE, idempotent) → 200
  {
    const r = await request(port, "POST", `/api/vendor-bills/${vendorBillId}/confirm`);
    assert("POST /:id/confirm — 200", r.status === 200, r.status);
    assert("POST /:id/confirm — status=DUE", r.body.data?.status === "DUE", r.body.data?.status);
  }

  // 3e. Get payments for bill (empty) → 200
  {
    const r = await request(port, "GET", `/api/vendor-bills/${vendorBillId}/payments`);
    assert("GET  /:id/payments — 200", r.status === 200, r.status);
    assert("GET  /:id/payments — empty array", Array.isArray(r.body.data) && r.body.data.length === 0, r.body.data);
  }

  // 3f. Get payments for non-existent bill → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "GET", `/api/vendor-bills/${fakeId}/payments`);
    assert("GET  /:badId/payments — 404", r.status === 404, r.status);
  }

  // 3g. Cancel vendor bill (no confirmed payments) → 200
  {
    const r = await request(port, "POST", `/api/vendor-bills/${vendorBillId}/cancel`);
    assert("POST /:id/cancel — 200", r.status === 200, r.status);
    assert("POST /:id/cancel — status=CANCELLED", r.body.data?.status === "CANCELLED", r.body.data?.status);
  }

  // 3h. Confirm cancelled bill → 400
  {
    const r = await request(port, "POST", `/api/vendor-bills/${vendorBillId}/confirm`);
    assert("POST /:id/confirm — cancelled → 400", r.status === 400, r.status);
  }

  // Create a fresh bill to test paid-cancel protection
  // First, create a new PO and bill
  let vendorBillId2;
  {
    const po = await request(port, "POST", "/api/purchase-orders", {
      purchase_id: 1004,
      vendor: vendorId,
      items: [{ product: product2._id.toString(), quantity: 3, unitPrice: 100 }]
    });
    const newPoId = po.body.data?._id;
    await request(port, "POST", `/api/purchase-orders/${newPoId}/confirm`);

    const bill = await request(port, "POST", `/api/purchase-orders/${newPoId}/vendor-bill`, {
      bill_number: 5002,
      due_date: "2026-11-01"
    });
    vendorBillId2 = bill.body.data?._id;
  }

  // 3i. Cancel bill that has confirmed payments → 400
  {
    // Seed a confirmed payment for this bill
    await Payment.create({
      vendorbill: vendorBillId2,
      payment_method: "CASH",
      amount: 50,
      status: "CONFIRM",
      type: "SEND",
      date: new Date()
    });

    const r = await request(port, "POST", `/api/vendor-bills/${vendorBillId2}/cancel`);
    assert("POST /:id/cancel — has payments → 400", r.status === 400, r.status);
  }

  // 3j. Confirm PAID bill → 400
  {
    // Manually mark bill as PAID
    const { VendorBill } = mongoose.models;
    await VendorBill.findByIdAndUpdate(vendorBillId2, { status: "PAID" });

    const r = await request(port, "POST", `/api/vendor-bills/${vendorBillId2}/confirm`);
    assert("POST /:id/confirm — PAID bill → 400", r.status === 400, r.status);
  }

  // 3k. Cancel PAID bill → 400
  {
    const r = await request(port, "POST", `/api/vendor-bills/${vendorBillId2}/cancel`);
    assert("POST /:id/cancel — PAID bill → 400", r.status === 400, r.status);
  }

  // ═══════════════════════════════════════════════════════════════
  //  4. VENDOR SELF-SERVICE (/api/me/vendor-bills)
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("4. Vendor Self-Service (/api/me/vendor-bills)");

  // Set fake user to vendor's contact_id
  fakeUser = { contact_id: vendorId };

  // 4a. Get my vendor bills → 200
  {
    const r = await request(port, "GET", "/api/me/vendor-bills");
    assert("GET  /me/vendor-bills — 200", r.status === 200, r.status);
    assert("GET  /me/vendor-bills — returns array", Array.isArray(r.body.data), r.body.data);
    assert("GET  /me/vendor-bills — has bills", r.body.data?.length >= 1, r.body.data?.length);
  }

  // 4b. Get my vendor bill by ID → 200
  {
    const r = await request(port, "GET", `/api/me/vendor-bills/${vendorBillId2}`);
    assert("GET  /me/vendor-bills/:id — 200", r.status === 200, r.status);
    assert("GET  /me/vendor-bills/:id — has data", !!r.body.data, r.body.data);
  }

  // 4c. Get bill that belongs to another vendor → 404
  {
    // Set fake user to the non-vendor (different contact_id)
    fakeUser = { contact_id: nonVendorId };

    const r = await request(port, "GET", `/api/me/vendor-bills/${vendorBillId2}`);
    assert("GET  /me/vendor-bills/:id — wrong vendor → 404", r.status === 404, r.status);
  }

  // ═══════════════════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════════════════
  log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}`);
  log(`${BOLD}  RESULTS:  ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : ""}${failed} failed${RESET}`);
  log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════════${RESET}`);

  if (failures.length > 0) {
    log(`\n${RED}Failed tests:${RESET}`);
    failures.forEach((f) => log(`  ${RED}✘${RESET} ${f}`));
  }



  // Cleanup
  server.close();
  await mongoose.disconnect();
  await mongod.stop();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(`${RED}Fatal error:${RESET}`, err);
  process.exit(1);
});
