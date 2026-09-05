/**
 * Test Suite: Product Image Upload & User Profile Image Upload
 * Tests multipart/form-data uploads to Cloudinary and database persistence.
 */

import express from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import Product from "./models/Product.js";
import Contact from "./models/Contact.js";
import User from "./models/User.js";
import productRoutes from "./routes/productRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

// Ensure test JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_2026";

// ── Colors for test output ──────────────────────────────────────────
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

// 1x1 transparent PNG binary buffer
const samplePngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function runTests() {
  log(`${BOLD}====================================================${RESET}`);
  log(`${BOLD}  TESTING: Product & User Profile Image Uploads    ${RESET}`);
  log(`${BOLD}====================================================${RESET}`);

  // 1. Setup in-memory MongoDB
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  log(`Connected to MongoMemoryServer: ${uri}`);

  // 2. Setup Express app with routes
  const app = express();
  app.use(express.json());
  app.use("/api/products", productRoutes);
  app.use("/api/auth", authRoutes);
  app.use((err, req, res, next) => {
    return res.status(400).json({
      success: false,
      message: err.message || "Upload error"
    });
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  log(`Test server running on ${baseUrl}`);

  try {
    // ════════════════════════════════════════════════════════════════════
    // SECTION 1: Product Image Upload (:id/image)
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("1. Product Image Upload Endpoint: POST /api/products/:id/image");

    // Create a base product
    const testProduct = await Product.create({
      productName: "Luxury Oak Dining Table",
      type: "GOODS",
      productImage: "https://via.placeholder.com/150",
      salesPrice: 850,
      cost: 450,
      category: "Dining Room"
    });

    // Test 1.1: Upload valid PNG image to existing product
    {
      const formData = new FormData();
      const imageBlob = new Blob([samplePngBuffer], { type: "image/png" });
      formData.append("image", imageBlob, "dining_table.png");

      const res = await fetch(`${baseUrl}/api/products/${testProduct._id}/image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 200, "1.1 Upload valid PNG image returns HTTP 200", `status=${res.status}`);
      assert(data.success === true, "1.1 Response body has success: true");
      assert(
        typeof data.data?.productImage === "string" && data.data.productImage.startsWith("https://res.cloudinary.com"),
        "1.1 Returned productImage is a valid Cloudinary HTTPS URL",
        `url=${data.data?.productImage}`
      );

      // Verify DB was updated
      const updatedProduct = await Product.findById(testProduct._id);
      assert(
        updatedProduct.productImage === data.data.productImage,
        "1.1 Database record reflects the newly uploaded Cloudinary image URL"
      );
    }

    // Test 1.2: Upload without image file
    {
      const formData = new FormData();
      const res = await fetch(`${baseUrl}/api/products/${testProduct._id}/image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 400, "1.2 Missing image file returns HTTP 400", `status=${res.status}`);
      assert(
        data.message === "Image file is required",
        "1.2 Error message indicates image file is required",
        `msg=${data.message}`
      );
    }

    // Test 1.3: Upload invalid file format (.txt)
    {
      const formData = new FormData();
      const txtBlob = new Blob(["not an image"], { type: "text/plain" });
      formData.append("image", txtBlob, "notes.txt");

      const res = await fetch(`${baseUrl}/api/products/${testProduct._id}/image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 400, "1.3 Non-image file upload is rejected with HTTP 400", `status=${res.status}`);
      assert(
        data.message === "Only image files are allowed",
        "1.3 Rejection message specifies 'Only image files are allowed'",
        `msg=${data.message}`
      );
    }

    // Test 1.4: Upload to non-existent product ID
    {
      const nonExistentId = new mongoose.Types.ObjectId();
      const formData = new FormData();
      const imageBlob = new Blob([samplePngBuffer], { type: "image/png" });
      formData.append("image", imageBlob, "sample.png");

      const res = await fetch(`${baseUrl}/api/products/${nonExistentId}/image`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 404, "1.4 Uploading to non-existent product returns HTTP 404", `status=${res.status}`);
      assert(data.message === "Product not found", "1.4 Message is 'Product not found'");
    }

    // ════════════════════════════════════════════════════════════════════
    // SECTION 2: Create Product with Image Upload (POST /api/products)
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("2. Create Product with Image Upload: POST /api/products");

    // Test 2.1: Create product with multipart image file
    {
      const formData = new FormData();
      formData.append("productName", "Modern Leather Sofa");
      formData.append("type", "GOODS");
      formData.append("salesPrice", "1200");
      formData.append("cost", "700");
      formData.append("category", "Living Room");
      const imageBlob = new Blob([samplePngBuffer], { type: "image/png" });
      formData.append("profile", imageBlob, "sofa.png");

      const res = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 201, "2.1 Create product with image returns HTTP 201", `status=${res.status}`);
      assert(data.success === true, "2.1 Response success is true");
      assert(
        data.data?.productImage?.startsWith("https://res.cloudinary.com"),
        "2.1 Created product has Cloudinary image URL",
        `url=${data.data?.productImage}`
      );
    }

    // Test 2.2: Create product with JSON body (without image upload)
    {
      const res = await fetch(`${baseUrl}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Ergonomic Office Chair",
          type: "GOODS",
          salesPrice: 250,
          cost: 130,
          category: "Office"
        })
      });
      const data = await res.json();

      assert(res.status === 201, "2.2 Create product without image returns HTTP 201", `status=${res.status}`);
      assert(
        data.data?.productImage === "https://via.placeholder.com/150",
        "2.2 Product without image defaults to placeholder URL"
      );
    }

    // ════════════════════════════════════════════════════════════════════
    // SECTION 3: User Profile Image Upload during Registration
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("3. User Profile Image Upload: POST /api/auth/register");

    // Test 3.1: Register CONTACT (Partner/Vendor) with profile image file
    {
      const formData = new FormData();
      formData.append("name", "Alice Vendor");
      formData.append("loginId", "alice_vendor");
      formData.append("userType", "CONTACT");
      formData.append("contactRole", "VENDOR");
      formData.append("email", "alice.vendor@example.com");
      formData.append("mobile", "9876543210");
      formData.append("city", "Mumbai");
      formData.append("state", "Maharashtra");
      formData.append("pincode", "400001");
      formData.append("password", "Password123!");
      const imageBlob = new Blob([samplePngBuffer], { type: "image/png" });
      formData.append("profile", imageBlob, "alice_avatar.png");

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 201, "3.1 Register CONTACT with profile image returns HTTP 201", `status=${res.status}`);
      assert(!!data.token, "3.1 JWT token is returned");
      assert(
        typeof data.contact?.profileImage === "string" &&
          data.contact.profileImage.includes("res.cloudinary.com"),
        "3.1 Contact profileImage is a Cloudinary URL",
        `url=${data.contact?.profileImage}`
      );

      // Verify DB
      const contactInDb = await Contact.findOne({ loginId: "alice_vendor" });
      assert(!!contactInDb, "3.1 Contact record exists in MongoDB");
      assert(
        contactInDb?.profileImage === data.contact.profileImage,
        "3.1 Database Contact record matches the Cloudinary URL"
      );
      assert(!!contactInDb?.user, "3.1 Contact has linked User reference");
    }

    // Test 3.2: Register ADMIN with profile image file
    {
      const formData = new FormData();
      formData.append("name", "Bob Admin");
      formData.append("loginId", "bob_admin");
      formData.append("userType", "ADMIN");
      formData.append("email", "bob.admin@example.com");
      formData.append("mobile", "9876543211");
      formData.append("city", "Delhi");
      formData.append("state", "Delhi");
      formData.append("pincode", "110001");
      formData.append("password", "Password123!");
      const imageBlob = new Blob([samplePngBuffer], { type: "image/png" });
      formData.append("profile", imageBlob, "bob_avatar.png");

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 201, "3.2 Register ADMIN with profile image returns HTTP 201", `status=${res.status}`);
      assert(
        typeof data.contact?.profileImage === "string" &&
          data.contact.profileImage.includes("res.cloudinary.com"),
        "3.2 Admin contact profileImage is a Cloudinary URL",
        `url=${data.contact?.profileImage}`
      );
    }

    // Test 3.3: Register user without profile image file (JSON fallback to default placeholder)
    {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Charlie Customer",
          loginId: "charlie_cust",
          userType: "CONTACT",
          contactRole: "CUSTOMER",
          email: "charlie@example.com",
          mobile: 9876543212,
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          profile: "https://via.placeholder.com/150",
          password: "Password123!"
        })
      });
      const data = await res.json();

      assert(res.status === 201, "3.3 Register with profile URL string returns HTTP 201", `status=${res.status}`);
      assert(
        data.contact?.profileImage === "https://via.placeholder.com/150",
        "3.3 Contact profileImage matches placeholder URL"
      );
    }

    // Test 3.4: Register user with invalid non-image file
    {
      const formData = new FormData();
      formData.append("name", "David Malicious");
      formData.append("loginId", "david_bad");
      formData.append("userType", "CONTACT");
      formData.append("contactRole", "CUSTOMER");
      formData.append("email", "david@example.com");
      formData.append("mobile", "9876543213");
      formData.append("city", "Pune");
      formData.append("state", "Maharashtra");
      formData.append("pincode", "411001");
      formData.append("password", "Password123!");
      const textBlob = new Blob(["malicious file"], { type: "text/plain" });
      formData.append("profile", textBlob, "bad_file.txt");

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      assert(res.status === 400, "3.4 Non-image file upload is rejected with HTTP 400", `status=${res.status}`);
      assert(
        data.message === "Only image files are allowed",
        "3.4 Error message is 'Only image files are allowed'",
        `msg=${data.message}`
      );
    }

    // ════════════════════════════════════════════════════════════════════
    // SECTION 4: Regression Check - Previous Endpoints Still Functional
    // ════════════════════════════════════════════════════════════════════
    sectionHeader("4. Verification of GET /api/products and /api/auth/login");

    // Test 4.1: Fetch products
    {
      const res = await fetch(`${baseUrl}/api/products`);
      const data = await res.json();
      assert(res.status === 200, "4.1 GET /api/products returns HTTP 200");
      assert(Array.isArray(data.data) && data.data.length >= 2, "4.1 Products list contains created products");
    }

    // Test 4.2: Login with the registered user
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: "alice_vendor",
          password: "Password123!"
        })
      });
      const data = await res.json();
      assert(res.status === 200, "4.2 Login returns HTTP 200");
      assert(!!data.token, "4.2 Login returns JWT token");
      assert(
        data.contact?.profileImage?.includes("res.cloudinary.com"),
        "4.2 Logged in contact retains uploaded profile image"
      );
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
    log(`\n${GREEN}${BOLD}🎉 ALL IMAGE UPLOAD TESTS PASSED SUCCESSFULLY!${RESET}\n`);
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered an unhandled error:", err);
  process.exit(1);
});
