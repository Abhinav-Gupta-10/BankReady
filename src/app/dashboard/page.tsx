import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CustomerDashboard() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // If user is Admin or Employee, redirect to their specialized portals
  if (session.role === "ADMIN") {
    redirect("/admin");
  }
  if (session.role === "EMPLOYEE") {
    redirect("/employee");
  }

  // Fetch customer tasks from database
  const tasks = await prisma.customerTask.findMany({
    where: { userId: session.id },
    include: {
      service: true,
      branch: {
        include: { bank: true },
      },
      checklistItems: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch preferred bank & branch
  const userRecord = await prisma.user.findUnique({
    where: { id: session.id },
  });

  let preferredBranch = null;
  if (userRecord?.preferredBranchId) {
    preferredBranch = await prisma.branch.findUnique({
      where: { id: userRecord.preferredBranchId },
      include: { bank: true },
    });
  }

  // If none preferred, grab the first available branch for display
  if (!preferredBranch) {
    preferredBranch = await prisma.branch.findFirst({
      include: { bank: true },
    });
  }

  // Fetch upcoming announcements & notifications
  const [announcementsCount, unreadNotificationsCount, holidays] = await Promise.all([
    prisma.announcement.count({
      where: {
        status: "PUBLISHED",
        ...(preferredBranch ? { OR: [{ branchId: preferredBranch.id }, { bankId: preferredBranch.bankId }, { bankId: null }] } : {}),
      },
    }),
    prisma.notification.count({
      where: { userId: session.id, isRead: false },
    }),
    prisma.branchHoliday.findMany({
      take: 2,
      orderBy: { holidayDate: "asc" },
    }),
  ]);

  // Derived Summary Card Metrics (calculated from real database records)
  const totalTasks = tasks.length;
  const readyTasks = tasks.filter((t) => t.status === "READY_FOR_VISIT").length;
  const actionRequiredTasks = tasks.filter((t) => t.status === "ACTION_REQUIRED" || t.status === "IN_PROGRESS").length;
  const incompleteChecklists = tasks.filter((t) =>
    t.checklistItems.some((item) => item.requirementCategory === "MANDATORY" && !item.isChecked)
  ).length;

  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 3600000 * 5.5);
  const formattedTime = istDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  const formattedDate = istDate.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Welcome Area */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#142D4E] tracking-tight">
              Welcome back, {session.name.split(" ")[0]}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Customer Account
            </span>
          </div>

          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formattedDate} — {formattedTime} IST</span>
            </span>

            {preferredBranch && (
              <span className="flex items-center gap-1.5 font-medium text-[#142D4E]">
                <svg className="w-4 h-4 text-[#B99A57]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{preferredBranch.bank.name} ({preferredBranch.name})</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/branches"
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors text-center"
          >
            Change Preferred Branch
          </Link>
          <Link
            href="/wizard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#B99A57] text-[#0B1F36] text-xs font-bold hover:bg-[#a68847] transition-all text-center shadow-sm"
          >
            + New Preparation
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Active Tasks</span>
          <div className="text-2xl font-black text-[#142D4E]">{totalTasks}</div>
          <span className="text-[10px] text-slate-500">Saved in your profile</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">Ready for Visit</span>
          <div className="text-2xl font-black text-[#18794E]">{readyTasks}</div>
          <span className="text-[10px] text-emerald-700">100% prepared tasks</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-[#B7791F] uppercase tracking-wider block">Action Needed</span>
          <div className="text-2xl font-black text-[#B7791F]">{actionRequiredTasks}</div>
          <span className="text-[10px] text-amber-700">Missing items or forms</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-red-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-red-800 uppercase tracking-wider block">Pending Docs</span>
          <div className="text-2xl font-black text-[#B42318]">{incompleteChecklists}</div>
          <span className="text-[10px] text-red-700">Unchecked mandates</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Branch Notices</span>
          <div className="text-2xl font-black text-[#142D4E]">{announcementsCount}</div>
          <span className="text-[10px] text-slate-500">Active announcements</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Upcoming Holiday</span>
          <div className="text-sm font-bold text-[#142D4E] truncate">
            {holidays[0]?.name || "None Scheduled"}
          </div>
          <span className="text-[10px] text-slate-500">{holidays[0]?.holidayDate || "Regular working days"}</span>
        </div>
      </div>

      {/* Main Working Action Buttons */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#142D4E] uppercase tracking-wider">Quick Actions & Workflows</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/wizard"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">Prepare a Bank Visit</div>
            <div className="text-[10px] text-slate-500">Run the step-by-step wizard</div>
          </Link>

          <Link
            href="/services"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">Check Banking Service</div>
            <div className="text-[10px] text-slate-500">Browse service rules & forms</div>
          </Link>

          <Link
            href="/account-readiness"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">Check Account Readiness</div>
            <div className="text-[10px] text-slate-500">Pre-screen withdrawal & KYC</div>
          </Link>

          <Link
            href="/branches"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">Find a Bank Branch</div>
            <div className="text-[10px] text-slate-500">Check hours, lunch & counters</div>
          </Link>

          <Link
            href="/tasks"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">Review Saved Tasks</div>
            <div className="text-[10px] text-slate-500">{totalTasks} tasks in progress</div>
          </Link>

          <Link
            href="/forms"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">View Official Forms</div>
            <div className="text-[10px] text-slate-500">Download Form 60, DA-1, etc.</div>
          </Link>

          <Link
            href="/notifications"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">View Notifications</div>
            <div className="text-[10px] text-slate-500">{unreadNotificationsCount} unread notices</div>
          </Link>

          <Link
            href="/holidays"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-[#142D4E] hover:bg-slate-50 transition-all flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#142D4E] text-[#B99A57] flex items-center justify-center font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-xs font-bold text-[#142D4E]">Bank Calendar</div>
            <div className="text-[10px] text-slate-500">2nd/4th Saturdays & holidays</div>
          </Link>
        </div>
      </div>

      {/* Saved Tasks Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-[#142D4E]">My Saved Banking Tasks</h2>
            <p className="text-xs text-slate-500">Manage checklist documents, mark missing items, and print summaries before visiting.</p>
          </div>
          <Link
            href="/tasks"
            className="text-xs font-bold text-[#142D4E] hover:text-[#B99A57] flex items-center gap-1"
          >
            <span>View All Tasks</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold">
              !
            </div>
            <p className="text-sm font-semibold text-slate-700">No saved banking tasks yet.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Run the Service Readiness Wizard to generate your first document checklist and visit plan.
            </p>
            <Link
              href="/wizard"
              className="inline-block px-4 py-2 rounded-lg bg-[#142D4E] text-white text-xs font-bold"
            >
              Start Preparation Wizard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const mandatoryCount = task.checklistItems.filter((i) => i.requirementCategory === "MANDATORY").length;
              const checkedMandatory = task.checklistItems.filter((i) => i.requirementCategory === "MANDATORY" && i.isChecked).length;
              const missingCount = task.checklistItems.filter((i) => i.isFlaggedMissing).length;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[#142D4E] text-sm">{task.service.name}</h3>
                      <StatusBadge status={task.status as any} />
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Branch: {task.branch?.name || "Standard Branch"}</span>
                      <span>•</span>
                      <span>Mandatory Prepared: {checkedMandatory} / {mandatoryCount}</span>
                      {missingCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-600 font-semibold">{missingCount} flagged missing</span>
                        </>
                      )}
                    </div>

                    {task.userNotes && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block">
                        &quot;{task.userNotes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#142D4E] transition-colors"
                    >
                      Open Checklist
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
