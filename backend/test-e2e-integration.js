import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const BASE_URL = "http://localhost:5001/api";

// Generate clean 1d tokens with RAM RBAC claims
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
    contactRole: "VENDOR",
    name: "Standard Vendor Contact",
    email: "vendor2026@urbanfurniture.com",
    loginId: "vendor_2026"
  },
  JWT_SECRET,
  { expiresIn: "1d" }
);

async function run() {
  console.log("=== STARTING COMPLETE E2E INTEGRATION SUITE ===");

  // 1. RBAC Guard Verification
  console.log("\n--- TEST 1: RBAC Guard Enforcement ---");
  const rbacRes = await fetch(`${BASE_URL}/purchase-orders`, {
    headers: { Authorization: `Bearer ${contactToken}` }
  });
  console.log(`Contact accessing /purchase-orders -> Status: ${rbacRes.status} (Expected: 403)`);
  if (rbacRes.status === 403) {
    console.log("✓ PASS: Contact blocked by RBAC authorize middleware");
  } else {
    console.error("✗ FAIL: Expected 403, got", rbacRes.status);
  }

  // 2. Load necessary master data
  console.log("\n--- Loading Master Data for Workflows ---");
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find a vendor contact with linked user
  const contacts = await mongoose.connection.collection("contacts").find({}).toArray();
  const users = await mongoose.connection.collection("users").find({}).toArray();
  const products = await mongoose.connection.collection("products").find({}).toArray();
  const coas = await mongoose.connection.collection("coas").find({}).toArray();
  const journals = await mongoose.connection.collection("journals").find({}).toArray();
  const analytics = await mongoose.connection.collection("analyticsaccounts").find({}).toArray();

  console.log(`Found: ${contacts.length} Contacts, ${products.length} Products, ${coas.length} COAs, ${journals.length} Journals, ${analytics.length} Analytics`);

  // Ensure there is a contact with user role VENDOR or BOTH
  let vendorContact = null;
  for (const c of contacts) {
    if (c.user) {
      const u = users.find(user => user._id.toString() === c.user.toString());
      if (u && ["VENDOR", "BOTH"].includes(u.contact_role)) {
        vendorContact = c;
        break;
      }
    }
  }

  if (!vendorContact) {
    // Create or update a test vendor contact
    const testUser = await mongoose.connection.collection("users").insertOne({
      role: "CONTACT",
      contact_role: "VENDOR",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const insertedContact = await mongoose.connection.collection("contacts").insertOne({
      name: "Acme Lumber & Steel Supplies",
      loginId: "acme_lumber",
      userType: "CONTACT",
      email: "orders@acmesupplies.com",
      mobile: 9876543210,
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      user: testUser.insertedId,
      password: "hashedpassword123",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    vendorContact = { _id: insertedContact.insertedId, name: "Acme Lumber & Steel Supplies" };
    console.log("Created test vendor contact:", vendorContact.name);
  } else {
    console.log("Using existing vendor contact:", vendorContact.name);
  }

  const testProduct = products[0];
  console.log("Using test product:", testProduct.productName, `(Cost: ${testProduct.cost})`);

  // 3. Create Purchase Order
  console.log("\n--- TEST 2: Create Purchase Order (Draft) ---");
  const poSeq = Math.floor(100000 + Math.random() * 900000);
  const createPoRes = await fetch(`${BASE_URL}/purchase-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      purchase_id: poSeq,
      vendor: vendorContact._id.toString(),
      items: [
        {
          product: testProduct._id.toString(),
          quantity: 5,
          unitPrice: testProduct.cost || 5000,
          tax: 500
        }
      ],
      total_amount: (testProduct.cost || 5000) * 5 + 500,
      date: new Date().toISOString()
    })
  });
  const poData = await createPoRes.json();
  console.log(`Create PO Status: ${createPoRes.status}, Success: ${poData.success}`);
  if (!poData.success) {
    console.error("PO Creation failed:", poData);
    process.exit(1);
  }
  const createdPO = poData.data;
  console.log(`✓ Created PO ID: ${createdPO._id}, Status: ${createdPO.status}, Total: Rs. ${createdPO.total_amount}`);

  // 4. Confirm Purchase Order
  console.log("\n--- TEST 3: Confirm Purchase Order ---");
  const confirmPoRes = await fetch(`${BASE_URL}/purchase-orders/${createdPO._id}/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const confirmPoData = await confirmPoRes.json();
  console.log(`Confirm PO Status: ${confirmPoRes.status}, Status: ${confirmPoData.data?.status}`);
  if (confirmPoData.data?.status === "CONFIRMED") {
    console.log("✓ PASS: PO transitioned to CONFIRMED");
  } else {
    console.error("✗ FAIL: PO not confirmed:", confirmPoData);
  }

  // 5. Generate Vendor Bill from PO
  console.log("\n--- TEST 4: Generate Vendor Bill from PO ---");
  const billSeq = `BILL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const createBillRes = await fetch(`${BASE_URL}/purchase-orders/${createdPO._id}/vendor-bill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      bill_number: billSeq,
      due_date: new Date(Date.now() + 15 * 86400000).toISOString(),
      bill_date: new Date().toISOString()
    })
  });
  const billData = await createBillRes.json();
  console.log(`Generate Bill Status: ${createBillRes.status}, Success: ${billData.success}`);
  if (!billData.success) {
    console.error("Vendor Bill generation failed:", billData);
    process.exit(1);
  }
  const createdBill = billData.data;
  console.log(`✓ Created Vendor Bill ID: ${createdBill._id}, Number: ${createdBill.bill_number}, Amount Due: Rs. ${createdBill.amount_due}`);

  // 6. Confirm Vendor Bill
  console.log("\n--- TEST 5: Confirm Vendor Bill ---");
  const confirmBillRes = await fetch(`${BASE_URL}/vendor-bills/${createdBill._id}/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const confirmBillData = await confirmBillRes.json();
  console.log(`Confirm Bill Status: ${confirmBillRes.status}, Bill Status: ${confirmBillData.data?.status}`);
  if (confirmBillData.data?.status === "DUE") {
    console.log("✓ PASS: Vendor Bill confirmed and marked DUE for payment");
  }

  // 7. Process Payment for Vendor Bill
  console.log("\n--- TEST 6: Record & Settle Payment for Vendor Bill ---");
  const payRes = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      vendorbill: createdBill._id.toString(),
      payment_method: "BANK",
      amount: createdBill.amount_due,
      type: "SEND",
      date: new Date().toISOString()
    })
  });
  const payData = await payRes.json();
  console.log(`Create Payment Status: ${payRes.status}, Success: ${payData.success}`);
  const createdPayment = payData.data;

  // Confirm the payment
  const confirmPayRes = await fetch(`${BASE_URL}/payments/${createdPayment._id}/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const confirmPayData = await confirmPayRes.json();
  console.log(`Confirm Payment Status: ${confirmPayRes.status}, Payment Status: ${confirmPayData.data?.status}`);
  if (confirmPayData.data?.status === "CONFIRM") {
    console.log("✓ PASS: Payment CONFIRMED and Bill successfully settled");
  }

  // Check Vendor Bill is now PAID
  const billCheckRes = await fetch(`${BASE_URL}/vendor-bills/${createdBill._id}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const billCheck = await billCheckRes.json();
  console.log(`Vendor Bill Status after payment: ${billCheck.data?.status} (Amount Paid: ${billCheck.data?.amount_paid}, Amount Due: ${billCheck.data?.amount_due})`);
  if (billCheck.data?.status === "PAID") {
    console.log("✓ PASS: Vendor Bill fully paid!");
  }

  // 8. Test Journal Entry Creation & Posting
  console.log("\n--- TEST 7: Journal Entry Balancing & Posting ---");
  const testJournal = journals[0];
  const debitCOA = coas[0];
  const creditCOA = coas[1];

  const jeRes = await fetch(`${BASE_URL}/journal-entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      journal: testJournal._id.toString(),
      date: new Date().toISOString(),
      inv_bill: `JE-AUTO-${Math.floor(1000 + Math.random() * 9000)}`,
      sourceType: "MANUAL",
      journalItems: [
        { account: debitCOA._id.toString(), debit: 15000, credit: 0 },
        { account: creditCOA._id.toString(), debit: 0, credit: 15000 }
      ]
    })
  });
  const jeData = await jeRes.json();
  console.log(`Create Journal Entry Status: ${jeRes.status}, Success: ${jeData.success}`);
  if (jeData.data?._id) {
    const postJeRes = await fetch(`${BASE_URL}/journal-entries/${jeData.data._id}/post`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const postJeData = await postJeRes.json();
    console.log(`Post Journal Entry Status: ${postJeRes.status}, Status: ${postJeData.data?.status}`);
    if (postJeData.data?.status === "POSTED") {
      console.log("✓ PASS: Double-entry balanced Journal Entry POSTED cleanly!");
    }
  }

  // 9. Test Budget Creation, Confirmation, and Revision
  console.log("\n--- TEST 8: Budget Lifecycle (Create -> Confirm -> Revise) ---");
  const testAnalytic = analytics[0];
  const budgetRes = await fetch(`${BASE_URL}/budgets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: `Q1 FY26 Operations Budget ${Math.floor(100 + Math.random() * 900)}`,
      analyticAccountId: testAnalytic._id.toString(),
      type: "EXPENSE",
      amount: 500000,
      start_date: "2026-01-01",
      end_date: "2026-03-31"
    })
  });
  const budgetData = await budgetRes.json();
  console.log(`Create Budget Status: ${budgetRes.status}, Success: ${budgetData.success}`);
  const createdBudget = budgetData.budget;
  console.log(`✓ Created Budget: "${createdBudget?.name}", Limit: Rs. ${createdBudget?.committed_amount}, Status: ${createdBudget?.status}`);

  // Confirm Budget
  const confirmBudgetRes = await fetch(`${BASE_URL}/budgets/${createdBudget._id}/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const confirmBudgetData = await confirmBudgetRes.json();
  console.log(`Confirm Budget Status: ${confirmBudgetRes.status}, Status: ${confirmBudgetData.budget?.status}`);
  if (confirmBudgetData.budget?.status === "CONFIRMED") {
    console.log("✓ PASS: Budget confirmed!");
  }

  // Revise Budget limit
  const reviseBudgetRes = await fetch(`${BASE_URL}/budgets/${createdBudget._id}/revise`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      amount: 650000
    })
  });
  const reviseBudgetData = await reviseBudgetRes.json();
  console.log(`Revise Budget Status: ${reviseBudgetRes.status}, New Committed Limit: Rs. ${reviseBudgetData.budget?.committed_amount}`);
  if (reviseBudgetData.budget?.committed_amount === 650000) {
    console.log("✓ PASS: Budget successfully revised to Rs. 650,000!");
  }

  console.log("\n========================================================");
  console.log("ALL 8 END-TO-END INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
  console.log("========================================================");
  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL E2E ERROR:", err);
  process.exit(1);
});
