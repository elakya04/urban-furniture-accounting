/**
 * Live End-to-End Test Suite for Budgets & Ledger Changes
 * Hits http://localhost:5001/api with JWT token against MongoDB Atlas
 */

import http from "http";

const BASE_URL = "http://localhost:5001/api";

// Use the token provided by user
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhOWMwNjc0ZWI1ODMyMTk3N2I4YzJiYSIsImlhdCI6MTc4ODYyNTkyOSwiZXhwIjoxNzg5MjMwNzI5fQ.E4z66iVneq50egLNQjYRdBKCAzWD75nUloHR3JDgZcg";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

let passed = 0;
let failed = 0;

function assert(condition, testName, details = "") {
  if (condition) {
    passed++;
    console.log(`  ${GREEN}✔ PASS:${RESET} ${testName}`);
  } else {
    failed++;
    console.log(`  ${RED}✖ FAIL:${RESET} ${testName} ${details ? `(${details})` : ""}`);
  }
}

async function request(method, endpoint, body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Authorization": `Bearer ${TOKEN}`
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data };
}

async function runTests() {
  console.log(`${BOLD}================================================================${RESET}`);
  console.log(`${BOLD}   TESTING ALL LEDGER & BUDGET ENDPOINTS (LIVE API)            ${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  // ───────────────────────────────────────────────────────────────────
  // PART 1: LEDGER TESTS
  // ───────────────────────────────────────────────────────────────────
  console.log(`${BOLD}${CYAN}━━━ 1. GENERAL LEDGER TESTS ━━━${RESET}`);

  // Fetch an existing account
  const accountsRes = await request("GET", "/accounts");
  assert(accountsRes.status === 200 && accountsRes.data.data?.length > 0, "Fetch chart of accounts for ledger test");
  
  const testAccount = accountsRes.data?.data?.[0];
  const accountId = testAccount?._id;
  console.log(`  Testing Ledger for Account: ${YELLOW}${testAccount?.accountName} (${accountId})${RESET}`);

  // Test 1.1: GET /api/ledger/:accid
  const ledgerRes1 = await request("GET", `/ledger/${accountId}`);
  assert(ledgerRes1.status === 200, `GET /api/ledger/${accountId} returns HTTP 200`);
  assert(Array.isArray(ledgerRes1.data?.ledger), "Ledger response contains 'ledger' array");

  // Test 1.2: GET /api/ledger/account/:accountId alias
  const ledgerRes2 = await request("GET", `/ledger/account/${accountId}`);
  assert(ledgerRes2.status === 200, `GET /api/ledger/account/${accountId} returns HTTP 200`);
  assert(ledgerRes2.data?.ledger?.length === ledgerRes1.data?.ledger?.length, "Both route aliases return consistent ledger records");

  // Test 1.3: Date filtering on ledger
  const today = new Date().toISOString().split("T")[0];
  const ledgerResDate = await request("GET", `/ledger/${accountId}?startDate=${today}`);
  assert(ledgerResDate.status === 200, `GET /api/ledger/${accountId}?startDate=${today} returns HTTP 200`);

  // Print ledger sample if any
  if (ledgerRes1.data?.ledger?.length > 0) {
    console.log(`  ${GREEN}Sample Ledger Item:${RESET}`, JSON.stringify(ledgerRes1.data.ledger[0]));
  } else {
    console.log(`  ${YELLOW}No posted journal items yet for this specific account, array empty (valid).${RESET}`);
  }

  // ───────────────────────────────────────────────────────────────────
  // PART 2: BUDGET TESTS
  // ───────────────────────────────────────────────────────────────────
  console.log(`\n${BOLD}${CYAN}━━━ 2. BUDGET LIFECYCLE & WORKFLOW TESTS ━━━${RESET}`);

  // 2.0 Get or create an analytic account for budget
  const TS = Date.now().toString().slice(-4);
  let analyticRes = await request("GET", "/analytic-accounts");
  let analyticAccId = analyticRes.data?.data?.[0]?._id;

  if (!analyticAccId) {
    const createAnalytic = await request("POST", "/analytic-accounts", {
      name: `Timber Production Analytics ${TS}`,
      type: "EXPENSE"
    });
    analyticAccId = createAnalytic.data?.data?._id;
  }
  assert(Boolean(analyticAccId), `Valid Analytic Account available (${analyticAccId})`);

  let budgetId = null;

  // Test 2.1: Validation failure: end_date <= start_date
  const invalidDateRes = await request("POST", "/budgets", {
    name: `Invalid Dates Budget ${TS}`,
    analyticAccountId: analyticAccId,
    type: "EXPENSE",
    amount: 50000,
    start_date: "2026-12-31",
    end_date: "2026-01-01"
  });
  assert(invalidDateRes.status === 400, "POST /budgets with end_date <= start_date rejected with HTTP 400", invalidDateRes.data?.message);

  // Test 2.2: Create valid Budget (Status: DRAFT)
  const createBudgetRes = await request("POST", "/budgets", {
    name: `Quarterly Timber Production ${TS}`,
    analyticAccountId: analyticAccId,
    type: "EXPENSE",
    amount: 85000,
    start_date: "2026-04-01",
    end_date: "2026-06-30"
  });
  assert(createBudgetRes.status === 201, "POST /budgets created successfully (HTTP 201)");
  assert(createBudgetRes.data?.budget?.status === "DRAFT", "New budget initialized with status 'DRAFT'");
  assert(createBudgetRes.data?.budget?.committed_amount === 85000, "Committed amount correctly set to 85,000");
  budgetId = createBudgetRes.data?.budget?._id;
  console.log(`  Created Budget ID: ${YELLOW}${budgetId}${RESET}`);

  // Test 2.3: GET /api/budgets list & filter
  const listBudgetsRes = await request("GET", "/budgets?status=DRAFT");
  assert(listBudgetsRes.status === 200, "GET /api/budgets?status=DRAFT returns HTTP 200");
  assert(listBudgetsRes.data?.budgets?.some(b => b._id === budgetId), "Newly created budget found in status=DRAFT query");

  // Test 2.4: GET /api/budgets/:id
  const getByIdRes = await request("GET", `/budgets/${budgetId}`);
  assert(getByIdRes.status === 200, `GET /api/budgets/${budgetId} returns HTTP 200`);
  assert(getByIdRes.data?.budget?.name === `Quarterly Timber Production ${TS}`, "Budget name matches");

  // Test 2.5: PATCH /api/budgets/:id (update details before confirmation)
  const updateRes = await request("PATCH", `/budgets/${budgetId}`, {
    name: `Revised Quarterly Timber Production ${TS}`,
    amount: 90000
  });
  assert(updateRes.status === 200, "PATCH /api/budgets/:id updates details (HTTP 200)");
  assert(updateRes.data?.budget?.committed_amount === 90000, "Updated committed amount to 90,000");

  // Test 2.6: POST /api/budgets/:id/confirm (DRAFT -> CONFIRMED)
  const confirmRes = await request("POST", `/budgets/${budgetId}/confirm`);
  assert(confirmRes.status === 200, "POST /budgets/:id/confirm returns HTTP 200");
  assert(confirmRes.data?.budget?.status === "CONFIRMED", "Budget status transitioned to 'CONFIRMED'");

  // Test 2.7: Prevent re-confirming an already confirmed budget
  const doubleConfirmRes = await request("POST", `/budgets/${budgetId}/confirm`);
  assert(doubleConfirmRes.status === 400, "Re-confirming confirmed budget rejected with HTTP 400", doubleConfirmRes.data?.message);

  // Test 2.8: POST /api/budgets/:id/revise (Revise after confirmation)
  const reviseRes = await request("POST", `/budgets/${budgetId}/revise`, {
    amount: 95000,
    end_date: "2026-07-15"
  });
  assert(reviseRes.status === 200, "POST /budgets/:id/revise successfully revised confirmed budget (HTTP 200)");
  assert(reviseRes.data?.budget?.committed_amount === 95000, "Committed amount revised to 95,000");

  // Test 2.9: GET /api/budgets/:id/report (Budget performance metrics)
  const reportRes = await request("GET", `/budgets/${budgetId}/report`);
  assert(reportRes.status === 200, "GET /api/budgets/:id/report returns HTTP 200");
  assert(reportRes.data?.report?.committed === 95000, "Report reflects committed amount 95,000");
  assert(reportRes.data?.report?.remaining !== undefined, "Report contains 'remaining' calculation");
  console.log(`  ${GREEN}Budget Report:${RESET}`, JSON.stringify(reportRes.data?.report));

  // Test 2.10: POST /api/budgets/:id/cancel
  const cancelRes = await request("POST", `/budgets/${budgetId}/cancel`);
  assert(cancelRes.status === 200, "POST /budgets/:id/cancel returns HTTP 200");
  assert(cancelRes.data?.budget?.status === "CANCELLED", "Budget status transitioned to 'CANCELLED'");

  // Test 2.11: Reject revising cancelled budget
  const reviseCancelledRes = await request("POST", `/budgets/${budgetId}/revise`, { amount: 100000 });
  assert(reviseCancelledRes.status === 400, "Revising cancelled budget rejected with HTTP 400", reviseCancelledRes.data?.message);

  // Test 2.12: Reject cancelling already cancelled budget
  const doubleCancelRes = await request("POST", `/budgets/${budgetId}/cancel`);
  assert(doubleCancelRes.status === 400, "Cancelling already cancelled budget rejected with HTTP 400", doubleCancelRes.data?.message);

  console.log(`\n${BOLD}================================================================${RESET}`);
  console.log(`  TOTAL TESTS: ${passed + failed} | ${GREEN}PASSED: ${passed}${RESET} | ${failed > 0 ? RED : GREEN}FAILED: ${failed}${RESET}`);
  console.log(`${BOLD}================================================================${RESET}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
