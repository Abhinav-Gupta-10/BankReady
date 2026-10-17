# BankReady — Pre-Visit Banking Assistance & Readiness Platform

BankReady is a complete, realistic, production-style full-stack banking readiness web application designed to help customers prepare for in-branch banking services before leaving home.

---

## 🏛️ Problem Solved
Customers often visit bank branches for withdrawals, KYC updates, PAN linkages, transaction limit enhancements, address updates, or nominee registrations, only to discover:
- A missing mandatory document (e.g. PAN Card or Form 60 for withdrawals >= ₹50,000 under Rule 114B).
- Incomplete Officially Valid Documents (OVDs).
- Staggered lunch counter availability.
- Mandatory 2nd or 4th Saturday closures or gazetted state holidays under the Negotiable Instruments Act.
- Unavailability of specific counter operations.

**BankReady eliminates these wasted visits** by providing pre-screened document checklists, rules engine assessments, branch operating status, official downloadable forms, and authorized account readiness checks.

---

## 🚀 Key Features

### 1. Two Distinct Portals
- **Customer Portal**: Self-registration, secure login, personalized dashboard, preferred bank & branch selection, interactive 5-step Service Readiness Wizard, persistent document checklists, and branch bulletin notifications.
- **Admin & Bank Employee Portal**: Role-based access control (RBAC). Platform administrators manage bank directories, services, and versioned statutory document rules. Branch officers manage authorized branch hours, lunch break windows, counter status notices, emergency closure declarations, and customer bulletins.

### 2. Service Readiness Rules Engine (`src/lib/readiness-engine.ts`)
- Implements accurate Indian banking regulations:
  - **Income Tax Rule 114B**: Mandatory PAN original & self-attested photocopy for cash withdrawals of ₹50,000 and above (or Form 60 declaration fallback).
  - **Section 194N**: TDS compliance advisories for high-value cash disbursals (>= ₹10 Lakhs).
  - **RBI Master Directions on KYC**: Officially Valid Documents (OVDs: Aadhaar, Passport, Voter ID), self-attestation mandates, and self-declarations for current address changes.
  - **Section 45ZA of Banking Regulation Act**: Nomination procedures (Form DA-1) and minor appointee requirements.
  - **RBI Weekend Mandate**: Automatic holiday calculations for Sundays and 2nd/4th Saturdays.
  - **Staggered Lunch Break Tracking**: Detects counter availability during midday windows.

### 3. Dedicated Account Readiness Checker (`/account-readiness`)
- **Mode A (Customer-Reported Information)**: Evaluates user-supplied facts regarding KYC, PAN linkage, and known account restrictions without requiring banking credentials.
- **Mode B (Bank Provider Sandbox)**: Implements a clean Open Banking integration provider interface (`BankAccountProvider`) simulating core banking checks (`getKycStatus`, `getPanLinkageStatus`, `getApplicableTransactionLimits`, `getServiceRestrictions`). If a bank integration is unavailable, it gracefully falls back with clear transparency disclaimers.

### 4. Interactive Personal Document Checklist (`/tasks`)
- Tasks saved from the wizard persist in SQLite/PostgreSQL.
- Check off items as you gather them at home.
- Flag missing documents with automatic status degradation (`ACTION_REQUIRED`).
- Add private customer visit notes.
- Printable, mobile-friendly visit summary.

### 5. Official Forms & Holiday Calendar (`/forms`, `/holidays`)
- Verified forms: Form 60, Form DA-1 (Nomination), Re-KYC Mandate, Form 15G/15H.
- National and gazetted holiday calendar.

---

## 🔐 Demo Accounts

Seed credentials are pre-configured in `scripts/seed.js`:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Demo Customer** | `demo.customer@bankready.test` | `Demo1234!` | Customer dashboard, saved tasks, wizard |
| **Platform Admin** | `demo.admin@bankready.test` | `DemoAdmin1234!` | Full system CRUD, document rules, stats |
| **Branch Employee** | `demo.employee@bankready.test` | `DemoEmp1234!` | Branch hours, lunch counters, announcements |

> *Quick Login buttons are provided directly on the `/login` screen for 1-click credential filling.*

---

## 🛠️ Technology Stack
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling**: Tailwind CSS with custom financial design system (Primary Navy `#142D4E`, Gold `#B99A57`, Success Green `#18794E`)
- **Database & ORM**: SQLite (`dev.db`) with Prisma ORM
- **Authentication**: Salted PBKDF2 password hashing (100,000 rounds sha512) and HMAC-SHA256 signed HTTP-only cookies
- **Testing**: Built-in `node:test` suite for rules engine and auth security

---

## 💻 Local Setup & Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Database & Seed Data**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run prisma:seed
   ```

3. **Run Unit Tests**:
   ```bash
   npm test
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security & Privacy Notice
BankReady **never** requests or stores sensitive credentials such as ATM PINs, Net Banking passwords, UPI PINs, OTPs, or CVV numbers.
