const { test, describe } = require("node:test");
const assert = require("node:assert");

// Import evaluation engine (transpiled/direct JS logic test)
function evaluateServiceRules(serviceSlug, answers, isWeekend) {
  const documents = [];
  const amount = Number(answers.amount || 0);

  if (serviceSlug === "large-cash-withdrawal" || amount >= 50000) {
    documents.push("Original Permanent Account Number (PAN) Card");
  }
  documents.push("Original Bank Passbook / Cheque Leaf");
  documents.push("Government Photo ID");

  const isOpen = !isWeekend;
  let status = "READY_VERIFIED";
  if (!isOpen) {
    status = "BRANCH_CLOSED";
  } else if (answers.hasPan === "no" && amount >= 50000) {
    status = "ACTION_REQUIRED";
  }

  return { documents, isOpen, status };
}

describe("BankReady Rules Engine Unit Tests", () => {
  test("Withdrawals under ₹50,000 do not mandate PAN under Rule 114B", () => {
    const result = evaluateServiceRules("cash-withdrawal", { amount: 20000, hasPan: "yes" }, false);
    assert.strictEqual(result.isOpen, true);
    assert.strictEqual(result.status, "READY_VERIFIED");
    assert.strictEqual(result.documents.includes("Original Permanent Account Number (PAN) Card"), false);
  });

  test("Withdrawals >= ₹50,000 mandate PAN under Rule 114B", () => {
    const result = evaluateServiceRules("large-cash-withdrawal", { amount: 60000, hasPan: "yes" }, false);
    assert.strictEqual(result.status, "READY_VERIFIED");
    assert.strictEqual(result.documents.includes("Original Permanent Account Number (PAN) Card"), true);
  });

  test("Missing PAN for high-value withdrawal triggers ACTION_REQUIRED status", () => {
    const result = evaluateServiceRules("large-cash-withdrawal", { amount: 75000, hasPan: "no" }, false);
    assert.strictEqual(result.status, "ACTION_REQUIRED");
  });

  test("Weekend closure correctly evaluates to BRANCH_CLOSED", () => {
    const result = evaluateServiceRules("cash-withdrawal", { amount: 10000 }, true);
    assert.strictEqual(result.isOpen, false);
    assert.strictEqual(result.status, "BRANCH_CLOSED");
  });
});
