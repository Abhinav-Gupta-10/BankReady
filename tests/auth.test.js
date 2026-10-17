const { test, describe } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");

const SESSION_SECRET = "test_secret_for_unit_tests";

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

function createToken(payload) {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 10000 });
  const encoded = Buffer.from(data).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

function verifyToken(token) {
  const [encoded, sig] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(encoded).digest("base64url");
  if (sig !== expectedSig) return null;
  return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
}

describe("BankReady Authentication & Authorization Unit Tests", () => {
  test("Password hashing with PBKDF2 produces distinct hashes with salt", () => {
    const hash1 = hashPassword("Demo1234!");
    const hash2 = hashPassword("Demo1234!");
    assert.notStrictEqual(hash1, hash2); // Salts differ
    assert.strictEqual(verifyPassword("Demo1234!", hash1), true);
    assert.strictEqual(verifyPassword("Demo1234!", hash2), true);
    assert.strictEqual(verifyPassword("WrongPass!", hash1), false);
  });

  test("Session token creates valid HMAC-SHA256 signature and decodes user payload", () => {
    const user = { id: "user_1", email: "test@bankready.test", role: "CUSTOMER" };
    const token = createToken(user);
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.email, "test@bankready.test");
    assert.strictEqual(decoded.role, "CUSTOMER");
  });

  test("Tampered session token fails verification", () => {
    const user = { id: "user_2", email: "admin@bankready.test", role: "ADMIN" };
    const token = createToken(user);
    const tampered = token.replace("a", "b");
    const result = verifyToken(tampered);
    assert.strictEqual(result, null);
  });
});
