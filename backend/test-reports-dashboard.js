import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const BASE_URL = "http://localhost:5001/api";
const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_urban_furniture_2026";

const adminToken = jwt.sign(
  {
    id: "6a9c5506d115d6e4f0c991a2",
    role: "ADMIN",
    userType: "ADMIN",
    contactRole: null,
    name: "System Administrator",
    email: "admin2026@urbanfurniture.com",
    loginId: "admin_2026"
  },
  JWT_SECRET,
  { expiresIn: "1d" }
);

const contactToken = jwt.sign(
  {
    id: "6a9c5506d115d6e4f0c991b5",
    role: "CONTACT",
    userType: "CONTACT",
    contactRole: "CUSTOMER",
    name: "Regular Customer Contact",
    email: "customer2026@urbanfurniture.com",
    loginId: "customer_2026"
  },
  JWT_SECRET,
  { expiresIn: "1d" }
);

async function run() {
  console.log("=================================================");
  console.log("STARTING REPORTS, DASHBOARD & FULL RBAC TEST SUITE");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  async function testEndpoint(name, url, options, expectedStatus) {
    try {
      const res = await fetch(url, options);
      const isExpected = res.status === expectedStatus;
      if (isExpected) {
        console.log(`✓ [PASS] ${name} -> Got ${res.status}`);
        passed++;
        return await res.json().catch(() => ({}));
      } else {
        console.error(`✗ [FAIL] ${name} -> Expected ${expectedStatus}, got ${res.status}`);
        failed++;
        return null;
      }
    } catch (err) {
      console.error(`✗ [ERROR] ${name} -> ${err.message}`);
      failed++;
      return null;
    }
  }

  // 1. Dashboard Summary Tests
  console.log("\n--- 1. Dashboard Summary Endpoint ---");
  const dashboardData = await testEndpoint(
    "Admin access to /dashboard/summary",
    `${BASE_URL}/dashboard/summary`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
    200
  );
  if (dashboardData?.summary) {
    console.log("  Summary Metrics:", {
      totalSales: dashboardData.summary.totalSales,
      totalPurchases: dashboardData.summary.totalPurchases,
      customerDues: dashboardData.summary.customerDues,
      vendorDues: dashboardData.summary.vendorDues,
      budget: dashboardData.summary.budget
    });
  }

  await testEndpoint(
    "Contact BLOCKED from /dashboard/summary",
    `${BASE_URL}/dashboard/summary`,
    { headers: { Authorization: `Bearer ${contactToken}` } },
    403
  );

  // 2. Profit & Loss Report Tests
  console.log("\n--- 2. Profit & Loss Report Endpoint ---");
  const plData = await testEndpoint(
    "Admin access to /reports/profit-loss",
    `${BASE_URL}/reports/profit-loss`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
    200
  );
  if (plData) {
    console.log("  P&L Figures:", {
      income: plData.income,
      expenses: plData.expenses,
      netIncome: plData.netIncome
    });
  }

  await testEndpoint(
    "Contact BLOCKED from /reports/profit-loss",
    `${BASE_URL}/reports/profit-loss`,
    { headers: { Authorization: `Bearer ${contactToken}` } },
    403
  );

  // 3. Balance Sheet Report Tests
  console.log("\n--- 3. Balance Sheet Report Endpoint ---");
  const bsData = await testEndpoint(
    "Admin access to /reports/balance-sheet",
    `${BASE_URL}/reports/balance-sheet`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
    200
  );
  if (bsData) {
    console.log("  Balance Sheet Figures:", {
      assets: bsData.assets,
      liabilities: bsData.liabilities,
      capital: bsData.capital,
      totalLiabilitiesAndCapital: bsData.totalLiabilitiesAndCapital
    });
  }

  await testEndpoint(
    "Contact BLOCKED from /reports/balance-sheet",
    `${BASE_URL}/reports/balance-sheet`,
    { headers: { Authorization: `Bearer ${contactToken}` } },
    403
  );

  // 4. Budget Report Tests
  console.log("\n--- 4. Budget Report Endpoint ---");
  const budgetReport = await testEndpoint(
    "Admin access to /reports/budget",
    `${BASE_URL}/reports/budget`,
    { headers: { Authorization: `Bearer ${adminToken}` } },
    200
  );
  if (budgetReport?.report) {
    console.log(`  Found ${budgetReport.count} budget report entries.`);
  }

  await testEndpoint(
    "Contact BLOCKED from /reports/budget",
    `${BASE_URL}/reports/budget`,
    { headers: { Authorization: `Bearer ${contactToken}` } },
    403
  );

  // 5. Full RBAC Lockdown Tests on All Other Sensitive Endpoints
  console.log("\n--- 5. Full RBAC Protection on Other Core Endpoints ---");
  
  // Sales Orders (Contact cannot create)
  await testEndpoint(
    "Contact BLOCKED from POST /sales-orders",
    `${BASE_URL}/sales-orders`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${contactToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    },
    403
  );

  // Products (Contact cannot create)
  await testEndpoint(
    "Contact BLOCKED from POST /products",
    `${BASE_URL}/products`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${contactToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    },
    403
  );

  // COA Accounts (Contact cannot create)
  await testEndpoint(
    "Contact BLOCKED from POST /accounts",
    `${BASE_URL}/accounts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${contactToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    },
    403
  );

  // Journals (Contact cannot create)
  await testEndpoint(
    "Contact BLOCKED from POST /journals",
    `${BASE_URL}/journals`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${contactToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    },
    403
  );

  // Analytic Accounts (Contact cannot create)
  await testEndpoint(
    "Contact BLOCKED from POST /analytic-accounts",
    `${BASE_URL}/analytic-accounts`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${contactToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({})
    },
    403
  );

  // Ledger (Contact cannot view)
  await testEndpoint(
    "Contact BLOCKED from GET /ledger/:accid",
    `${BASE_URL}/ledger/test_account_id`,
    {
      headers: { Authorization: `Bearer ${contactToken}` }
    },
    403
  );

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
  console.log("=================================================");

  if (failed > 0) process.exit(1);
  process.exit(0);
}

run();
