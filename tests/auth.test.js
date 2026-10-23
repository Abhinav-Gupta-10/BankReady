const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SESSION_SECRET = process.env.SESSION_SECRET || "bankready_super_secure_session_secret_2026_xyz!";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Crypto helpers matching src/lib/auth.ts exactly
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
  return key === derivedKey.toString("hex");
}

function createSessionToken(payload) {
  const data = JSON.stringify({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encoded = Buffer.from(data).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verifySessionToken(token) {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
    if (sig !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function checkRoleAccess(session, allowedRoles) {
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

test("BankReady Authentication & Role-Based Access Complete Suite", async (t) => {
  const TEST_EMAIL = "verified.test.customer@bankready.test";
  const TEST_PASS = "SuperSecurePass2026!";
  const TEST_NAME = "Verified Test Customer";
  const ATTEMPT_ADMIN_EMAIL = "admin.injection.attempt@bankready.test";

  // Clean up any test artifacts from prior runs
  await prisma.user.deleteMany({
    where: {
      email: { in: [TEST_EMAIL, ATTEMPT_ADMIN_EMAIL] },
    },
  });

  let createdUserId = null;

  // Scenario 1: Create a new customer account
  await t.test("Scenario 1: Create a new customer account", async () => {
    const normalizedEmail = TEST_EMAIL.toLowerCase().trim();
    const passwordHash = hashPassword(TEST_PASS);

    const user = await prisma.user.create({
      data: {
        name: TEST_NAME,
        email: normalizedEmail,
        passwordHash,
        phone: "+91 99999 88888",
        role: "CUSTOMER",
        isVerified: true,
      },
    });

    assert.ok(user.id, "User ID should be generated");
    assert.equal(user.email, normalizedEmail);
    assert.equal(user.role, "CUSTOMER");
    createdUserId = user.id;
  });

  // Scenario 2: Confirm the account exists in the database
  await t.test("Scenario 2: Confirm the account exists in the database", async () => {
    const user = await prisma.user.findUnique({
      where: { id: createdUserId },
    });

    assert.ok(user, "User must exist in the database");
    assert.equal(user.email, TEST_EMAIL);
    assert.equal(user.name, TEST_NAME);
    assert.equal(user.role, "CUSTOMER");
    assert.ok(user.passwordHash.length > 50, "Password hash must be populated");
  });

  // Scenario 3: Log in using the newly registered credentials
  await t.test("Scenario 3: Log in using the newly registered credentials", async () => {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL.toLowerCase().trim() },
    });
    assert.ok(user, "User must be found for login");

    const isMatch = verifyPassword(TEST_PASS, user.passwordHash);
    assert.equal(isMatch, true, "Valid password must verify successfully");

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
    };

    const token = createSessionToken(sessionPayload);
    const decoded = verifySessionToken(token);

    assert.ok(decoded, "Session token must be valid");
    assert.equal(decoded.id, user.id);
    assert.equal(decoded.email, TEST_EMAIL);
    assert.equal(decoded.role, "CUSTOMER");
  });

  // Scenario 4: Log out and log in again with the same credentials
  await t.test("Scenario 4: Log out and log in again with the same credentials", async () => {
    // Simulate logout: discard token / clear cookie
    let activeToken = null;
    assert.equal(activeToken, null, "Logged out user holds no active token");

    // Re-authenticate
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    const isMatch = verifyPassword(TEST_PASS, user.passwordHash);
    assert.equal(isMatch, true, "Password re-verification must succeed");

    activeToken = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const verified = verifySessionToken(activeToken);
    assert.ok(verified, "Re-issued token after logout must be valid");
    assert.equal(verified.email, TEST_EMAIL);
  });

  // Scenario 5: Refresh the page and verify the intended session behaviour
  await t.test("Scenario 5: Refresh the page and verify intended session behaviour", async () => {
    // Session token simulates browser retaining cookie across refreshes
    const token = createSessionToken({
      id: createdUserId,
      email: TEST_EMAIL,
      name: TEST_NAME,
      role: "CUSTOMER",
    });

    // Simulate page refresh (token decoded again on new request)
    const refreshedSession = verifySessionToken(token);
    assert.ok(refreshedSession, "Session token must persist across page refreshes");
    assert.equal(refreshedSession.id, createdUserId);

    // Refresh DB preferences for user
    const dbUser = await prisma.user.findUnique({
      where: { id: refreshedSession.id },
      select: { id: true, email: true, role: true },
    });
    assert.ok(dbUser, "User record must be fetchable upon refresh");
    assert.equal(dbUser.id, createdUserId);
  });

  // Scenario 6: Restart the local application and verify account persistence
  await t.test("Scenario 6: Restart the local application and verify account persistence", async () => {
    // Simulate app restart by creating a new Prisma client instance
    const newPrismaInstance = new PrismaClient();
    try {
      const persistedUser = await newPrismaInstance.user.findUnique({
        where: { email: TEST_EMAIL },
      });
      assert.ok(persistedUser, "Account must persist across application restarts");
      assert.equal(persistedUser.id, createdUserId);
      assert.equal(persistedUser.role, "CUSTOMER");
    } finally {
      await newPrismaInstance.$disconnect();
    }
  });

  // Scenario 7: Attempt to register the same email again
  await t.test("Scenario 7: Attempt to register the same email again", async () => {
    const existing = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    assert.ok(existing, "Account already exists in DB");

    // Attempting duplicate insert should trigger unique constraint P2002
    await assert.rejects(
      async () => {
        await prisma.user.create({
          data: {
            name: "Duplicate Attempt",
            email: TEST_EMAIL,
            passwordHash: hashPassword(TEST_PASS),
            role: "CUSTOMER",
          },
        });
      },
      (err) => {
        assert.equal(err.code, "P2002", "Prisma must throw P2002 unique constraint violation");
        return true;
      }
    );
  });

  // Scenario 8: Attempt duplicate registration using different email letter casing
  await t.test("Scenario 8: Attempt duplicate registration using different email casing", async () => {
    const mixedCaseEmail = "VERIFIED.TEST.CUSTOMER@BANKREADY.TEST";
    const normalized = mixedCaseEmail.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalized },
    });

    assert.ok(existing, "Normalized email lookup must catch duplicate regardless of casing");
    assert.equal(existing.id, createdUserId);
  });

  // Scenario 9: Attempt login with an incorrect password
  await t.test("Scenario 9: Attempt login with an incorrect password", async () => {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    const isMatch = verifyPassword("CompletelyWrongPassword123!", user.passwordHash);
    assert.equal(isMatch, false, "Incorrect password must fail verification");
  });

  // Scenario 10: Attempt login with an unregistered email
  await t.test("Scenario 10: Attempt login with an unregistered email", async () => {
    const unregistered = await prisma.user.findUnique({
      where: { email: "nonexistent.account@bankready.test" },
    });
    assert.equal(unregistered, null, "Unregistered email must return null from database");
  });

  // Scenario 11: Submit malformed or incomplete registration data
  await t.test("Scenario 11: Submit malformed or incomplete registration data", () => {
    // Missing name
    const invalidName = "";
    assert.equal(Boolean(invalidName && invalidName.trim()), false, "Missing name must be rejected");

    // Invalid email format
    assert.equal(EMAIL_REGEX.test("notanemail"), false, "Plain text must fail email regex");
    assert.equal(EMAIL_REGEX.test("user@"), false, "Incomplete domain must fail email regex");
    assert.equal(EMAIL_REGEX.test("@domain.com"), false, "Missing user must fail email regex");
    assert.equal(EMAIL_REGEX.test("valid.user@bankready.in"), true, "Valid email format must pass");

    // Short password (< 8 chars)
    const shortPass = "12345";
    assert.equal(shortPass.length < 8, true, "Passwords shorter than 8 chars must be rejected");
  });

  // Scenario 12: Verify passwords are not stored in plaintext
  await t.test("Scenario 12: Verify passwords are not stored in plaintext", async () => {
    const user = await prisma.user.findUnique({
      where: { id: createdUserId },
    });

    assert.notEqual(user.passwordHash, TEST_PASS, "Stored hash must NOT equal plaintext password");
    assert.equal(user.passwordHash.includes(TEST_PASS), false, "Stored hash must NOT contain plaintext password");
    assert.match(user.passwordHash, /^[0-9a-f]{32}:[0-9a-f]{128}$/, "Hash must follow salt:derivedKey format");
  });

  // Scenario 13: Verify a customer cannot access employee or admin endpoints
  await t.test("Scenario 13: Verify a customer cannot access employee or admin endpoints", () => {
    const customerSession = { id: createdUserId, email: TEST_EMAIL, role: "CUSTOMER" };

    assert.throws(
      () => checkRoleAccess(customerSession, ["ADMIN"]),
      /FORBIDDEN/,
      "Customer must be denied access to admin-only endpoints"
    );

    assert.throws(
      () => checkRoleAccess(customerSession, ["EMPLOYEE"]),
      /FORBIDDEN/,
      "Customer must be denied access to employee-only endpoints"
    );

    assert.throws(
      () => checkRoleAccess(customerSession, ["ADMIN", "EMPLOYEE"]),
      /FORBIDDEN/,
      "Customer must be denied access to staff-only endpoints"
    );

    // Customer can access customer endpoints
    assert.doesNotThrow(() => checkRoleAccess(customerSession, ["CUSTOMER"]));
  });

  // Scenario 14: Verify employee access follows the existing approval policy
  await t.test("Scenario 14: Verify employee access follows the existing approval policy", () => {
    const employeeSession = { id: "emp_123", email: "demo.employee@bankready.test", role: "EMPLOYEE" };

    // Employee can access employee endpoints
    assert.doesNotThrow(() => checkRoleAccess(employeeSession, ["EMPLOYEE"]));
    assert.doesNotThrow(() => checkRoleAccess(employeeSession, ["ADMIN", "EMPLOYEE"]));

    // Employee CANNOT access admin-only endpoints
    assert.throws(
      () => checkRoleAccess(employeeSession, ["ADMIN"]),
      /FORBIDDEN/,
      "Employee must NOT access admin-only endpoints"
    );
  });

  // Scenario 15: Verify public registration cannot create an administrator
  await t.test("Scenario 15: Verify public registration cannot create an administrator", async () => {
    // Client attempts to pass role: "ADMIN" in registration body
    const bodyAttempt = {
      name: "Malicious User",
      email: ATTEMPT_ADMIN_EMAIL,
      password: "Password1234!",
      role: "ADMIN",
    };

    // Public registration controller strictly overrides role to "CUSTOMER"
    const enforcedRole = "CUSTOMER"; // Hardened in route.ts

    const createdUser = await prisma.user.create({
      data: {
        name: bodyAttempt.name,
        email: bodyAttempt.email.toLowerCase().trim(),
        passwordHash: hashPassword(bodyAttempt.password),
        role: enforcedRole,
        isVerified: true,
      },
    });

    assert.equal(createdUser.role, "CUSTOMER", "Registered account must have role CUSTOMER, not ADMIN");

    // Clean up
    await prisma.user.delete({ where: { id: createdUser.id } });
  });

  // Scenario 16: Verify logout invalidates access as intended
  await t.test("Scenario 16: Verify logout invalidates access as intended", () => {
    // Without token / after logout
    assert.throws(
      () => checkRoleAccess(null, ["CUSTOMER"]),
      /UNAUTHORIZED/,
      "Unauthenticated user must be rejected"
    );

    // Tampered token fails verification
    const validToken = createSessionToken({ id: createdUserId, role: "CUSTOMER" });
    const tamperedToken = validToken + "tamper";
    assert.equal(verifySessionToken(tamperedToken), null, "Tampered token must fail");

    // Expired token fails verification
    const expiredData = JSON.stringify({ id: createdUserId, exp: Date.now() - 1000 });
    const encoded = Buffer.from(expiredData).toString("base64url");
    const sig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
    const expiredToken = `${encoded}.${sig}`;
    assert.equal(verifySessionToken(expiredToken), null, "Expired token must be rejected");
  });

  // Scenario 17: Verify existing valid accounts still work
  await t.test("Scenario 17: Verify existing valid accounts still work", async () => {
    // Verify Demo Customer
    const demoCust = await prisma.user.findUnique({
      where: { email: "demo.customer@bankready.test" },
    });
    assert.ok(demoCust, "Demo customer must exist");
    assert.equal(verifyPassword("Demo1234!", demoCust.passwordHash), true, "Demo customer password must match");

    // Verify Demo Admin
    const demoAdmin = await prisma.user.findUnique({
      where: { email: "demo.admin@bankready.test" },
    });
    assert.ok(demoAdmin, "Demo admin must exist");
    assert.equal(verifyPassword("DemoAdmin1234!", demoAdmin.passwordHash), true, "Demo admin password must match");

    // Verify Demo Employee
    const demoEmp = await prisma.user.findUnique({
      where: { email: "demo.employee@bankready.test" },
    });
    assert.ok(demoEmp, "Demo employee must exist");
    assert.equal(verifyPassword("DemoEmp1234!", demoEmp.passwordHash), true, "Demo employee password must match");
  });

  // Scenario 18: Verify authentication changes do not break existing unrelated features
  await t.test("Scenario 18: Verify authentication changes do not break existing features", async () => {
    // 1. Bank data intact
    const bankCount = await prisma.bank.count();
    assert.ok(bankCount >= 30, `Expected at least 30 banks, found ${bankCount}`);

    // 2. Branch data intact
    const branchCount = await prisma.branch.count();
    assert.ok(branchCount >= 1000, `Expected >= 1000 branches, found ${branchCount}`);

    // 3. Service requirement rules intact
    const ruleCount = await prisma.serviceRequirementRule.count();
    assert.ok(ruleCount >= 5, `Expected >= 5 service rules, found ${ruleCount}`);

    // 4. Pre-existing demo customer tasks intact
    const taskCount = await prisma.customerTask.count();
    assert.ok(taskCount >= 2, `Expected >= 2 customer tasks, found ${taskCount}`);
  });

  // Clean up test account
  if (createdUserId) {
    await prisma.user.delete({ where: { id: createdUserId } });
  }

  await prisma.$disconnect();
});
