/**
 * Endpoint Integration Test Script
 * Tests all 4 controllers: Product, Account, Journal, AnalyticAccount
 * Uses mongodb-memory-server so no external DB is needed.
 */

import http from "node:http";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";

// ── Import routes ────────────────────────────────────────────────
import productRoutes from "./routes/productRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import analyticAccountRoutes from "./routes/analyticAccountRoutes.js";

// ── Colours for terminal output ──────────────────────────────────
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
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
          resolve({ status: res.statusCode, body: data });
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
    log(`  ${RED}✘ FAIL${RESET} — ${testName}  (got: ${JSON.stringify(actual)})`);
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  log(`${BOLD}${CYAN}╔════════════════════════════════════════════════════╗${RESET}`);
  log(`${BOLD}${CYAN}║   Controller Endpoint Integration Tests            ║${RESET}`);
  log(`${BOLD}${CYAN}╚════════════════════════════════════════════════════╝${RESET}`);

  // 1. Start in-memory MongoDB
  log(`\n${YELLOW}▸ Starting in-memory MongoDB...${RESET}`);
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  log(`${GREEN}▸ Connected to in-memory MongoDB${RESET}`);

  // 2. Create Express app
  const app = express();
  app.use(express.json());
  app.use("/api/products", productRoutes);
  app.use("/api/accounts", accountRoutes);
  app.use("/api/journals", journalRoutes);
  app.use("/api/analytic-accounts", analyticAccountRoutes);

  const server = app.listen(0); // random available port
  const port = server.address().port;
  log(`${GREEN}▸ Server running on port ${port}${RESET}\n`);

  // ─── Track IDs created during tests ────────────────────────────
  let productId, accountId, journalId, analyticId;

  // ═══════════════════════════════════════════════════════════════
  //  1. PRODUCT CONTROLLER
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("1. Product Controller (/api/products)");

  // 1a. Create product — missing fields → 400
  {
    const r = await request(port, "POST", "/api/products", { productName: "Chair" });
    assert("POST /api/products — missing fields → 400", r.status === 400, r.status);
  }

  // 1b. Create product — valid → 201
  {
    const r = await request(port, "POST", "/api/products", {
      productName: "Oak Dining Table",
      type: "GOODS",
      salesPrice: 450,
      cost: 200,
      category: "Tables"
    });
    assert("POST /api/products — valid body → 201", r.status === 201, r.status);
    assert("POST /api/products — success=true", r.body.success === true, r.body.success);
    assert("POST /api/products — returns product data", !!r.body.data?._id, r.body.data);
    productId = r.body.data?._id;
  }

  // 1c. Get all products → 200
  {
    const r = await request(port, "GET", "/api/products");
    assert("GET  /api/products — status 200", r.status === 200, r.status);
    assert("GET  /api/products — returns array", Array.isArray(r.body.data), r.body.data);
    assert("GET  /api/products — array has 1 item", r.body.data.length === 1, r.body.data.length);
  }

  // 1d. Get product by ID → 200
  {
    const r = await request(port, "GET", `/api/products/${productId}`);
    assert("GET  /api/products/:id — status 200", r.status === 200, r.status);
    assert("GET  /api/products/:id — correct name", r.body.data?.productName === "Oak Dining Table", r.body.data?.productName);
  }

  // 1e. Get product by bad ID → 500 (invalid ObjectId)
  {
    const r = await request(port, "GET", "/api/products/invalidid");
    assert("GET  /api/products/invalidid — 500", r.status === 500, r.status);
  }

  // 1f. Update product → 200
  {
    const r = await request(port, "PATCH", `/api/products/${productId}`, {
      salesPrice: 500
    });
    assert("PATCH /api/products/:id — status 200", r.status === 200, r.status);
    assert("PATCH /api/products/:id — price updated", r.body.data?.salesPrice === 500, r.body.data?.salesPrice);
  }

  // 1g. Archive product → 200
  {
    const r = await request(port, "POST", `/api/products/${productId}/archive`);
    assert("POST  /api/products/:id/archive — 200", r.status === 200, r.status);
    assert("POST  /api/products/:id/archive — isActive=false", r.body.data?.isActive === false, r.body.data?.isActive);
  }

  // ═══════════════════════════════════════════════════════════════
  //  2. ACCOUNT CONTROLLER (COA)
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("2. Account Controller (/api/accounts)");

  // 2a. Create account — missing fields → 400
  {
    const r = await request(port, "POST", "/api/accounts", { accountName: "Cash" });
    assert("POST /api/accounts — missing type → 400", r.status === 400, r.status);
  }

  // 2b. Create account — valid → 201
  {
    const r = await request(port, "POST", "/api/accounts", {
      accountName: "Cash",
      type: "ASSET"
    });
    assert("POST /api/accounts — valid → 201", r.status === 201, r.status);
    assert("POST /api/accounts — success=true", r.body.success === true, r.body.success);
    accountId = r.body.data?._id;
  }

  // 2c. Create duplicate account → 409
  {
    const r = await request(port, "POST", "/api/accounts", {
      accountName: "Cash",
      type: "ASSET"
    });
    assert("POST /api/accounts — duplicate → 409", r.status === 409, r.status);
  }

  // 2d. Get all accounts → 200
  {
    const r = await request(port, "GET", "/api/accounts");
    assert("GET  /api/accounts — status 200", r.status === 200, r.status);
    assert("GET  /api/accounts — count=1", r.body.count === 1, r.body.count);
  }

  // 2e. Get accounts with filter
  {
    const r = await request(port, "GET", "/api/accounts?type=ASSET");
    assert("GET  /api/accounts?type=ASSET — returns 1", r.body.data?.length === 1, r.body.data?.length);
  }

  // 2f. Get account by ID → 200
  {
    const r = await request(port, "GET", `/api/accounts/${accountId}`);
    assert("GET  /api/accounts/:id — 200", r.status === 200, r.status);
    assert("GET  /api/accounts/:id — correct name", r.body.data?.accountName === "Cash", r.body.data?.accountName);
  }

  // 2g. Update account → 200
  {
    const r = await request(port, "PATCH", `/api/accounts/${accountId}`, {
      accountName: "Cash in Hand"
    });
    assert("PATCH /api/accounts/:id — 200", r.status === 200, r.status);
    assert("PATCH /api/accounts/:id — name updated", r.body.data?.accountName === "Cash in Hand", r.body.data?.accountName);
  }

  // 2h. Update account status → 200
  {
    const r = await request(port, "PATCH", `/api/accounts/${accountId}/status`, {
      isActive: false
    });
    assert("PATCH /api/accounts/:id/status — 200", r.status === 200, r.status);
    assert("PATCH /api/accounts/:id/status — deactivated", r.body.data?.isActive === false, r.body.data?.isActive);
  }

  // 2i. Update account status — bad value → 400
  {
    const r = await request(port, "PATCH", `/api/accounts/${accountId}/status`, {
      isActive: "yes"
    });
    assert("PATCH /api/accounts/:id/status — non-bool → 400", r.status === 400, r.status);
  }

  // 2j. Get account ledger (empty) → 200
  {
    const r = await request(port, "GET", `/api/accounts/${accountId}/ledger`);
    assert("GET  /api/accounts/:id/ledger — 200", r.status === 200, r.status);
    assert("GET  /api/accounts/:id/ledger — empty data", Array.isArray(r.body.data), r.body.data);
  }

  // ═══════════════════════════════════════════════════════════════
  //  3. JOURNAL CONTROLLER
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("3. Journal Controller (/api/journals)");

  // 3a. Create journal — missing fields → 400
  {
    const r = await request(port, "POST", "/api/journals", { journalName: "Sales" });
    assert("POST /api/journals — missing type → 400", r.status === 400, r.status);
  }

  // 3b. Create journal — valid → 201
  {
    const r = await request(port, "POST", "/api/journals", {
      journalName: "Sales Journal",
      type: "SALES"
    });
    assert("POST /api/journals — valid → 201", r.status === 201, r.status);
    assert("POST /api/journals — success=true", r.body.success === true, r.body.success);
    journalId = r.body.data?._id;
  }

  // 3c. Create duplicate journal → 409
  {
    const r = await request(port, "POST", "/api/journals", {
      journalName: "Sales Journal",
      type: "SALES"
    });
    assert("POST /api/journals — duplicate → 409", r.status === 409, r.status);
  }

  // 3d. Create journal with bad def_debitAcc → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "POST", "/api/journals", {
      journalName: "Purchase Journal",
      type: "PURCHASE",
      def_debitAcc: fakeId
    });
    assert("POST /api/journals — bad debit acc → 404", r.status === 404, r.status);
  }

  // Re-activate the account so we can use it
  await request(port, "PATCH", `/api/accounts/${accountId}/status`, { isActive: true });

  // 3e. Create journal with valid def_debitAcc → 201
  {
    const r = await request(port, "POST", "/api/journals", {
      journalName: "Purchase Journal",
      type: "PURCHASE",
      def_debitAcc: accountId
    });
    assert("POST /api/journals — with debit acc → 201", r.status === 201, r.status);
  }

  // 3f. Get all journals → 200
  {
    const r = await request(port, "GET", "/api/journals");
    assert("GET  /api/journals — status 200", r.status === 200, r.status);
    assert("GET  /api/journals — count=2", r.body.count === 2, r.body.count);
  }

  // 3g. Get journal by ID → 200
  {
    const r = await request(port, "GET", `/api/journals/${journalId}`);
    assert("GET  /api/journals/:id — 200", r.status === 200, r.status);
    assert("GET  /api/journals/:id — correct name", r.body.data?.journalName === "Sales Journal", r.body.data?.journalName);
  }

  // 3h. Update journal → 200
  {
    const r = await request(port, "PATCH", `/api/journals/${journalId}`, {
      journalName: "Main Sales Journal"
    });
    assert("PATCH /api/journals/:id — 200", r.status === 200, r.status);
    assert("PATCH /api/journals/:id — name updated", r.body.data?.journalName === "Main Sales Journal", r.body.data?.journalName);
  }

  // 3i. Update journal with bad acc → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "PATCH", `/api/journals/${journalId}`, {
      def_creditAcc: fakeId
    });
    assert("PATCH /api/journals/:id — bad credit acc → 404", r.status === 404, r.status);
  }

  // ═══════════════════════════════════════════════════════════════
  //  4. ANALYTIC ACCOUNT CONTROLLER
  // ═══════════════════════════════════════════════════════════════
  sectionHeader("4. Analytic Account Controller (/api/analytic-accounts)");

  // 4a. Create — missing fields → 400
  {
    const r = await request(port, "POST", "/api/analytic-accounts", { name: "Marketing" });
    assert("POST /api/analytic-accounts — missing type → 400", r.status === 400, r.status);
  }

  // 4b. Create — valid → 201
  {
    const r = await request(port, "POST", "/api/analytic-accounts", {
      name: "Marketing",
      type: "EXPENSE"
    });
    assert("POST /api/analytic-accounts — valid → 201", r.status === 201, r.status);
    assert("POST /api/analytic-accounts — success=true", r.body.success === true, r.body.success);
    analyticId = r.body.data?._id;
  }

  // 4c. Create duplicate → 409
  {
    const r = await request(port, "POST", "/api/analytic-accounts", {
      name: "Marketing",
      type: "EXPENSE"
    });
    assert("POST /api/analytic-accounts — duplicate → 409", r.status === 409, r.status);
  }

  // 4d. Get all → 200
  {
    const r = await request(port, "GET", "/api/analytic-accounts");
    assert("GET  /api/analytic-accounts — 200", r.status === 200, r.status);
    assert("GET  /api/analytic-accounts — count=1", r.body.count === 1, r.body.count);
  }

  // 4e. Get with search filter
  {
    const r = await request(port, "GET", "/api/analytic-accounts?search=mark");
    assert("GET  /api/analytic-accounts?search=mark — found", r.body.data?.length === 1, r.body.data?.length);
  }

  // 4f. Get by ID → 200
  {
    const r = await request(port, "GET", `/api/analytic-accounts/${analyticId}`);
    assert("GET  /api/analytic-accounts/:id — 200", r.status === 200, r.status);
    assert("GET  /api/analytic-accounts/:id — correct name", r.body.data?.name === "Marketing", r.body.data?.name);
  }

  // 4g. Get by bad ID → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "GET", `/api/analytic-accounts/${fakeId}`);
    assert("GET  /api/analytic-accounts/:badId — 404", r.status === 404, r.status);
  }

  // 4h. Update → 200
  {
    const r = await request(port, "PATCH", `/api/analytic-accounts/${analyticId}`, {
      name: "Digital Marketing"
    });
    assert("PATCH /api/analytic-accounts/:id — 200", r.status === 200, r.status);
    assert("PATCH /api/analytic-accounts/:id — name updated", r.body.data?.name === "Digital Marketing", r.body.data?.name);
  }

  // 4i. Update non-existent → 404
  {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const r = await request(port, "PATCH", `/api/analytic-accounts/${fakeId}`, {
      name: "X"
    });
    assert("PATCH /api/analytic-accounts/:badId — 404", r.status === 404, r.status);
  }

  // ═══════════════════════════════════════════════════════════════
  //  SUMMARY
  // ═══════════════════════════════════════════════════════════════
  log(`\n${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);
  log(`${BOLD}  RESULTS:  ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : ""}${failed} failed${RESET}`);
  log(`${BOLD}${CYAN}═══════════════════════════════════════════════════════${RESET}`);

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
