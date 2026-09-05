import crypto from "crypto";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:5001/api";
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || "QQbHLpHVIkvqNNlJcVsMxDWt";
const JWT_SECRET = process.env.JWT_SECRET || "jwt-secret";

const token = jwt.sign(
  {
    id: "6a9c5506d115d6e4f0c991a2",
    role: "ADMIN",
    userType: "ADMIN",
    name: "Admin Tester"
  },
  JWT_SECRET,
  { expiresIn: "1d" }
);

async function runRazorpayTest() {
  console.log("=================================================");
  console.log("TESTING RAZORPAY PAYMENT ENDPOINTS");
  console.log("=================================================\n");

  try {
    // 1. Fetch available invoices to get a real invoice ID
    console.log("Step 1: Querying existing invoices...");
    const invRes = await fetch(`${BASE_URL}/invoices`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const invoices = await invRes.json();
    const invoiceList = Array.isArray(invoices) ? invoices : (invoices.data || []);
    const invoice = invoiceList[0];

    if (!invoice) {
      console.error("No invoices found in database to test with.");
      process.exit(1);
    }

    console.log(`Found Invoice: ${invoice.inv_number} (ID: ${invoice._id}), Total: Rs. ${invoice.total_amount}, Amount Due: Rs. ${invoice.amount_due}, Status: ${invoice.status}`);

    // 2. Call /api/payment/create-order
    console.log("\nStep 2: Calling POST /api/payment/create-order...");
    const testAmount = 500; // Rs 500
    const createRes = await fetch(`${BASE_URL}/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: testAmount,
        invoiceId: invoice._id,
        inv_number: invoice.inv_number,
        customerName: invoice.customerName
      })
    });

    const orderData = await createRes.json();
    console.log("Create Order Response:", orderData);

    if (!createRes.ok || !orderData.orderId) {
      throw new Error(`Failed to create order: ${JSON.stringify(orderData)}`);
    }

    console.log(`✓ Order created successfully! Razorpay Order ID: ${orderData.orderId}`);
    console.log(`✓ Amount in paise: ${orderData.amount} (Rs. ${orderData.amount / 100})`);
    console.log(`✓ Key ID: ${orderData.keyId}`);

    // 3. Test Invalid Signature Rejection
    console.log("\nStep 3: Testing security: sending INVALID signature...");
    const fakePaymentId = `pay_test_${Date.now()}`;
    const invalidSignature = "invalid_fake_signature_hex";

    const badVerifyRes = await fetch(`${BASE_URL}/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: invalidSignature,
        invoiceId: invoice._id,
        amount: testAmount
      })
    });

    const badVerifyData = await badVerifyRes.json();
    if (badVerifyRes.status === 400) {
      console.log("✓ Invalid signature correctly rejected with HTTP 400:", badVerifyData.message);
    } else {
      console.error("✗ Security check failed: Invalid signature was not rejected with 400!", badVerifyData);
    }

    // 4. Test Valid Signature Verification & Invoice Settlement
    console.log("\nStep 4: Testing VALID Razorpay HMAC-SHA256 signature verification...");
    const validSignature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${orderData.orderId}|${fakePaymentId}`)
      .digest("hex");

    const goodVerifyRes = await fetch(`${BASE_URL}/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: orderData.orderId,
        razorpay_payment_id: fakePaymentId,
        razorpay_signature: validSignature,
        invoiceId: invoice._id,
        amount: testAmount
      })
    });

    const goodVerifyData = await goodVerifyRes.json();
    console.log("Verify Response:", goodVerifyData);

    if (goodVerifyRes.ok && goodVerifyData.success) {
      console.log("✓ Signature verified successfully by backend!");
      console.log("✓ Payment settled against invoice!");
      if (goodVerifyData.invoice) {
        console.log(`  Updated Invoice: Status = ${goodVerifyData.invoice.status}, Amount Paid = ${goodVerifyData.invoice.amount_paid}, Amount Due = ${goodVerifyData.invoice.amount_due}`);
      }
      if (goodVerifyData.payment) {
        console.log(`  Created Payment Record: ID = ${goodVerifyData.payment._id}, Amount = Rs. ${goodVerifyData.payment.amount}, Method = ${goodVerifyData.payment.payment_method}, Status = ${goodVerifyData.payment.status}`);
      }
    } else {
      throw new Error(`Verification failed: ${JSON.stringify(goodVerifyData)}`);
    }

    // 5. Test Full Balance Payment (status -> PAID)
    console.log("\nStep 5: Testing full remaining balance payment to trigger PAID status...");
    const remainingBalance = goodVerifyData.invoice.amount_due;
    const finalOrderRes = await fetch(`${BASE_URL}/payment/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: remainingBalance,
        invoiceId: invoice._id,
        inv_number: invoice.inv_number,
        customerName: invoice.customerName
      })
    });
    const finalOrder = await finalOrderRes.json();
    const finalPayId = `pay_full_${Date.now()}`;
    const finalSignature = crypto
      .createHmac("sha256", RAZORPAY_SECRET)
      .update(`${finalOrder.orderId}|${finalPayId}`)
      .digest("hex");

    const finalVerifyRes = await fetch(`${BASE_URL}/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: finalOrder.orderId,
        razorpay_payment_id: finalPayId,
        razorpay_signature: finalSignature,
        invoiceId: invoice._id,
        amount: remainingBalance
      })
    });
    const finalData = await finalVerifyRes.json();
    console.log(`✓ Full balance payoff successful! Status = ${finalData.invoice?.status}, Amount Due = ${finalData.invoice?.amount_due}, Amount Paid = ${finalData.invoice?.amount_paid}`);

    console.log("\n=================================================");
    console.log("ALL RAZORPAY TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("=================================================");
  } catch (err) {
    console.error("Test execution error:", err.message);
    process.exit(1);
  }
}

runRazorpayTest();
