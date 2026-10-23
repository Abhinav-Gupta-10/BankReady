const test = require('node:test');
const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

test('Bank & Branch Authentic Integration Test Suite', async (t) => {

  await t.test('1. Bank selection loads authentic bank records (32 major Indian banks)', async () => {
    const banks = await prisma.bank.findMany({
      where: { isEnabled: true },
      orderBy: { name: 'asc' }
    });
    assert.ok(banks.length >= 32, `Expected at least 32 banks, found ${banks.length}`);

    const sbi = banks.find(b => b.code === 'SBI');
    assert.ok(sbi, 'SBI must exist');
    assert.equal(sbi.name, 'State Bank of India');
    assert.equal(sbi.websiteUrl, 'https://sbi.co.in');

    const hdfc = banks.find(b => b.code === 'HDFC');
    assert.ok(hdfc, 'HDFC Bank must exist');

    const canara = banks.find(b => b.code === 'CANARA');
    assert.ok(canara, 'Canara Bank must exist');
  });

  await t.test('2. Searching by bank name and code returns authentic bank records', async () => {
    const pnb = await prisma.bank.findFirst({
      where: {
        OR: [
          { name: { contains: 'Punjab National' } },
          { code: 'PNB' }
        ]
      }
    });
    assert.ok(pnb, 'PNB search must succeed');
    assert.equal(pnb.name, 'Punjab National Bank');
  });

  await t.test('3. Branch searching returns actual authentic branch records with verified provenance', async () => {
    const branches = await prisma.branch.findMany({
      take: 20,
      include: { bank: true }
    });
    assert.equal(branches.length, 20);

    for (const b of branches) {
      assert.ok(b.name && b.name.length > 0, 'Branch must have non-empty name');
      assert.ok(/^[A-Z]{4}0[A-Z0-9]{6}$/.test(b.ifscCode), `IFSC must match RBI pattern: ${b.ifscCode}`);
      assert.ok(b.address && b.address.length > 5, 'Address must be authentic and non-empty');
      assert.ok(b.state && b.state.length > 0, 'State must be present');
      assert.equal(b.verifiedSource, 'RBI NEFT/RTGS Directory (via Razorpay IFSC v2.0.62)');
    }
  });

  await t.test('4. IFSC lookup works for major banks', async () => {
    const testCases = [
      { ifsc: 'SBIN0000691', expectedCity: 'NEW DELHI', bankCode: 'SBI' },
      { ifsc: 'HDFC0000009', expectedCity: 'BANGALORE URBAN', bankCode: 'HDFC' },
      { ifsc: 'PUNB0014800', expectedCity: 'DELHI', bankCode: 'PNB' },
      { ifsc: 'BARB0CONNAU', expectedCity: 'DELHI', bankCode: 'BOB' }
    ];

    for (const tc of testCases) {
      const branch = await prisma.branch.findFirst({
        where: { ifscCode: tc.ifsc },
        include: { bank: true }
      });
      assert.ok(branch, `Branch with IFSC ${tc.ifsc} must be found`);
      assert.equal(branch.bank.code, tc.bankCode);
      assert.ok(branch.city.includes(tc.expectedCity) || tc.expectedCity.includes(branch.city),
        `City mismatch for ${tc.ifsc}: got ${branch.city}, expected ${tc.expectedCity}`);
    }
  });

  await t.test('5. Results are strictly associated with the selected bank (No cross-mixing)', async () => {
    const hdfcBank = await prisma.bank.findFirst({ where: { code: 'HDFC' } });
    assert.ok(hdfcBank);

    const hdfcBranches = await prisma.branch.findMany({
      where: { bankId: hdfcBank.id },
      take: 50,
      include: { bank: true }
    });

    assert.ok(hdfcBranches.length > 0, 'Should find HDFC branches');
    for (const br of hdfcBranches) {
      assert.equal(br.bankId, hdfcBank.id, `Branch ${br.ifscCode} must belong to HDFC`);
      assert.equal(br.bank.code, 'HDFC');
      assert.ok(br.ifscCode.startsWith('HDFC'), `HDFC IFSC must start with HDFC, got ${br.ifscCode}`);
    }
  });

  await t.test('6. State, city, and PIN code searches work accurately', async () => {
    // City search
    const delhiBranches = await prisma.branch.findMany({
      where: { city: { contains: 'DELHI' } },
      take: 10
    });
    assert.ok(delhiBranches.length > 0, 'Delhi city search must return branches');

    // State search
    const maharashtraBranches = await prisma.branch.findMany({
      where: { state: { contains: 'MAHARASHTRA' } },
      take: 10
    });
    assert.ok(maharashtraBranches.length > 0, 'Maharashtra state search must return branches');

    // PIN code search
    const pinBranch = await prisma.branch.findFirst({
      where: { pinCode: '110001' }
    });
    assert.ok(pinBranch, '110001 PIN search must return branch');
    assert.equal(pinBranch.pinCode, '110001');
  });

  await t.test('7. Empty results and invalid inputs are handled safely', async () => {
    const invalidIfsc = await prisma.branch.findFirst({
      where: { ifscCode: 'INVALID00000' }
    });
    assert.equal(invalidIfsc, null, 'Invalid IFSC should return null safely');

    const emptyBranches = await prisma.branch.findMany({
      where: { city: 'NONEXISTENT_XYZ_CITY_999' }
    });
    assert.deepEqual(emptyBranches, [], 'Nonexistent city search should return empty array');
  });

  await t.test('8. Existing user data and customer tasks remain uncorrupted', async () => {
    const usersCount = await prisma.user.count();
    assert.ok(usersCount >= 3, `Expected at least 3 users, found ${usersCount}`);

    const demoCust = await prisma.user.findUnique({ where: { email: 'demo.customer@bankready.test' } });
    const demoAdmin = await prisma.user.findUnique({ where: { email: 'demo.admin@bankready.test' } });
    const demoEmp = await prisma.user.findUnique({ where: { email: 'demo.employee@bankready.test' } });
    assert.ok(demoCust, 'Demo customer must be intact');
    assert.ok(demoAdmin, 'Demo admin must be intact');
    assert.ok(demoEmp, 'Demo employee must be intact');

    const tasks = await prisma.customerTask.findMany({
      include: { branch: true }
    });
    assert.equal(tasks.length, 2, 'Customer tasks must remain intact');
    for (const t of tasks) {
      assert.ok(t.branch, 'Task branch relationship must remain intact');
      assert.equal(t.branch.ifscCode, 'SBIN0000691', 'Task must point to preserved SBIN0000691 branch');
    }
  });

  await t.test('9. Complete authentic Kanpur Nagar bank branch coverage', async () => {
    const kanpurBranches = await prisma.branch.findMany({
      where: { city: 'Kanpur' },
      include: { bank: true }
    });

    assert.ok(kanpurBranches.length >= 750, `Expected at least 750 Kanpur branches, found ${kanpurBranches.length}`);

    // Verify key banks are represented in Kanpur
    const bankNames = new Set(kanpurBranches.map(b => b.bank.name));
    assert.ok(bankNames.has('State Bank of India'), 'SBI must have branches in Kanpur');
    assert.ok(bankNames.has('Punjab National Bank'), 'PNB must have branches in Kanpur');
    assert.ok(bankNames.has('Bank of Baroda'), 'BOB must have branches in Kanpur');
    assert.ok(bankNames.has('HDFC Bank'), 'HDFC must have branches in Kanpur');
    assert.ok(bankNames.has('Canara Bank'), 'Canara Bank must have branches in Kanpur');
    assert.ok(bankNames.has('Union Bank of India'), 'Union Bank must have branches in Kanpur');
    assert.ok(bankNames.has('ICICI Bank'), 'ICICI Bank must have branches in Kanpur');
    assert.ok(bankNames.has('Central Bank of India'), 'Central Bank must have branches in Kanpur');
  });

  await t.test('10. Kanpur branches have authentic 208xxx/209xxx PIN codes and valid RBI IFSC format', async () => {
    const kanpurBranches = await prisma.branch.findMany({
      where: { city: 'Kanpur' }
    });

    assert.ok(kanpurBranches.length >= 750, 'Must have at least 750 branches');

    for (const b of kanpurBranches) {
      assert.ok(/^[A-Z]{4}0[A-Z0-9]{6}$/.test(b.ifscCode), `IFSC must follow RBI pattern: ${b.ifscCode}`);
      assert.ok(/^(208|209)[0-9]{3}$/.test(b.pinCode), `PIN code must be a valid 208xxx/209xxx postal code: ${b.pinCode} for ${b.name}`);
      assert.equal(b.state, 'Uttar Pradesh');
    }
  });

  await t.test('11. Kanpur Dehat is not mixed into Kanpur Nagar city branches', async () => {
    const dehatInNagar = await prisma.branch.findMany({
      where: {
        city: 'Kanpur',
        address: { contains: 'Kanpur Dehat' }
      }
    });

    assert.equal(dehatInNagar.length, 0, 'Kanpur Dehat branches must not be mislabeled as Kanpur city');
  });

});

test.after(async () => {
  await prisma.$disconnect();
});
