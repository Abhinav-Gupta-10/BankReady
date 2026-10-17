import React from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function LandingPage() {
  const commonServices = [
    {
      title: "Cash Withdrawal (>= ₹50,000)",
      category: "Cash & Transactions",
      desc: "Mandatory PAN card or Form 60 compliance under Income Tax Rule 114B. Teller voucher requirements.",
      slug: "large-cash-withdrawal",
      badge: "Mandatory PAN",
    },
    {
      title: "Periodic KYC Re-Verification",
      category: "Account Maintenance",
      desc: "Officially Valid Document (OVD) rules, self-attestation standards, and proof of address guidelines.",
      slug: "kyc-update",
      badge: "RBI Mandate",
    },
    {
      title: "PAN Linkage & Update",
      category: "Tax Compliance",
      desc: "Linking PAN to customer CIF, Form 60 fallback options, and income tax database matching.",
      slug: "pan-update",
      badge: "Crucial for TDS",
    },
    {
      title: "Nominee Addition (Form DA-1)",
      category: "Account Maintenance",
      desc: "Section 45ZA statutory nomination. Passbook endorsement and minor nominee guardian rules.",
      slug: "nominee-update",
      badge: "Form DA-1",
    },
    {
      title: "Cheque Book & Positive Pay",
      category: "Instruments",
      desc: "Requisition rules and fraud-prevention registration for cheques above ₹50,000.",
      slug: "cheque-book-request",
      badge: "Fraud Defense",
    },
    {
      title: "Address Updation",
      category: "Account Maintenance",
      desc: "Acceptable utility proofs under 2 months, self-declaration for current address, and OVD norms.",
      slug: "kyc-update",
      badge: "OVD Norms",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Select Service & Branch",
      desc: "Choose from 20+ banking operations and select your specific bank and local branch.",
    },
    {
      step: "02",
      title: "Answer Dynamic Context",
      desc: "Enter transaction details such as amount, PAN availability, or account type to tailor requirements.",
    },
    {
      step: "03",
      title: "Instant Rules Evaluation",
      desc: "Our rules engine checks regulatory mandates (RBI, CBDT), branch operating hours, and counter breaks.",
    },
    {
      step: "04",
      title: "Get Printable Visit Plan",
      desc: "Carry exact originals, verified photocopy counts, required pre-filled forms, and arrive prepared.",
    },
  ];

  const faqs = [
    {
      q: "Does completing a checklist guarantee my transaction will succeed?",
      a: "No. BankReady provides informational guidance based on verified regulatory policies and bank circulars. The actual execution remains subject to in-person document verification, signature matching, and officer authorization at your branch.",
    },
    {
      q: "Why is a PAN card required for cash withdrawals of ₹50,000 and above?",
      a: "Under Section 139A and Rule 114B of the Indian Income Tax Rules, quoting PAN or submitting Form 60 is mandatory for cash transactions exceeding ₹50,000 at any banking institution.",
    },
    {
      q: "Can I use BankReady without connecting my bank account?",
      a: "Yes. BankReady is fully functional without any bank credentials. You can use our customer-reported mode to generate accurate document checklists and branch visit summaries without linking an account.",
    },
    {
      q: "How does BankReady know if a branch is open?",
      a: "Branch hours, lunch breaks, and holiday schedules are derived from official bank directories, Negotiable Instruments Act holiday lists (including 2nd & 4th Saturdays), and live updates published by authorized branch staff.",
    },
  ];

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0B1F36] to-[#142D4E] text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-[#0B1F36]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F36] border border-[#B99A57]/40 text-[#B99A57] text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#18794E]"></span>
            Pre-Branch Banking Verification Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Know Before You Go <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#B99A57]">
              to the Bank.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Check required documents, prepare your banking tasks, review real-time branch opening hours, lunch breaks, and understand potential regulatory constraints before leaving home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/wizard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#B99A57] text-[#0B1F36] font-bold text-base hover:bg-[#a68847] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>Check My Banking Requirements</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>

            <Link
              href="/branches"
              className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-[#0B1F36] border border-slate-700 text-white font-semibold text-base hover:bg-[#0B1F36]/80 transition-all flex items-center justify-center gap-2"
            >
              <span>Find a Bank Branch</span>
            </Link>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            *Account-specific status verification depends on verified regulatory rules or authorized participating bank integration feeds.
          </p>
        </div>
      </section>

      {/* Quick Value Pillars */}
      <section className="bg-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#142D4E] text-base mb-1">Accurate Document Checklists</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Know whether originals are mandatory, exact verified photocopy counts, self-attestation rules, and valid proof alternatives.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#142D4E] text-base mb-1">Branch Timings & Breaks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Avoid reaching during staggered lunch breaks, 2nd or 4th Saturday holidays, or unannounced counter disruptions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="w-10 h-10 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#142D4E] text-base mb-1">Statutory Pre-Screening</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Rules engine evaluates Income Tax Rule 114B (cash limits), RBI Re-KYC cycles, and Positive Pay thresholds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Common Banking Services */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#142D4E]">Frequently Prepared Banking Services</h2>
          <p className="text-sm text-slate-600 mt-2">
            Select a service to inspect verified document requirements, statutory forms, and official regulatory sources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commonServices.map((service, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-[#142D4E] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{service.category}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#B99A57]/15 text-[#142D4E] border border-[#B99A57]/30">
                    {service.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#142D4E] mb-2">{service.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{service.desc}</p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/wizard?service=${service.slug}`}
                  className="text-xs font-bold text-[#142D4E] hover:text-[#B99A57] flex items-center gap-1"
                >
                  <span>Prepare Checklist</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">Verified Rule</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#142D4E] text-[#142D4E] text-sm font-semibold hover:bg-[#142D4E] hover:text-white transition-colors"
          >
            <span>Explore All 20+ Services</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-slate-100 py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#142D4E]">How BankReady Works</h2>
            <p className="text-sm text-slate-600 mt-2">
              A straightforward four-step verification process to eliminate duplicate branch visits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {steps.map((item, idx) => (
              <div key={idx} className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm relative">
                <span className="text-3xl font-black text-[#B99A57]/30 absolute top-4 right-4">{item.step}</span>
                <h3 className="text-base font-bold text-[#142D4E] mt-4 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#142D4E]">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-600 mt-2">
            Clear, transparent answers about our readiness evaluations and data privacy.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <h3 className="font-bold text-[#142D4E] text-sm mb-1.5 flex items-start gap-2">
                <span className="text-[#B99A57] font-extrabold">Q.</span>
                <span>{faq.q}</span>
              </h3>
              <p className="text-xs text-slate-600 pl-5 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#142D4E] text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Ready to plan your next bank branch visit?</h2>
            <p className="text-sm text-slate-300">
              Generate your personalized document checklist and visit summary in under 2 minutes.
            </p>
          </div>
          <Link
            href="/wizard"
            className="px-6 py-3 rounded-lg bg-[#B99A57] text-[#0B1F36] font-bold text-sm hover:bg-[#a68847] transition-all whitespace-nowrap"
          >
            Start Readiness Wizard
          </Link>
        </div>
      </section>
    </div>
  );
}
