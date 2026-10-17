"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default function CustomerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) {
          setTasks(data.tasks);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this banking preparation task?")) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch {
      alert("Failed to delete task.");
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#142D4E]">My Saved Banking Tasks</h1>
          <p className="text-xs text-slate-500">
            Track document preparations, update checked items, and review visit summaries.
          </p>
        </div>

        <Link
          href="/wizard"
          className="px-5 py-2.5 rounded-lg bg-[#B99A57] text-[#0B1F36] text-xs font-bold hover:bg-[#a68847] transition-all shadow-sm flex items-center gap-2"
        >
          <span>+ Prepare New Task</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          Loading saved tasks...
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center font-bold">
            !
          </div>
          <p className="text-sm font-semibold text-slate-700">No saved tasks yet.</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the Service Readiness Wizard to prepare for a service and save your checklist.
          </p>
          <Link
            href="/wizard"
            className="inline-block px-4 py-2 rounded-lg bg-[#142D4E] text-white text-xs font-bold"
          >
            Launch Wizard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const mandatoryCount = task.checklistItems.filter((i: any) => i.requirementCategory === "MANDATORY").length;
            const checkedMandatory = task.checklistItems.filter((i: any) => i.requirementCategory === "MANDATORY" && i.isChecked).length;
            const missingCount = task.checklistItems.filter((i: any) => i.isFlaggedMissing).length;

            return (
              <div
                key={task.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#142D4E] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={task.status as any} />
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(task.id, e)}
                      className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete task"
                    >
                      Delete
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#142D4E] leading-snug">{task.service.name}</h3>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>
                      Branch: <strong className="text-slate-700">{task.branch?.name || "Standard Branch"}</strong>
                    </div>
                    <div>
                      Bank: <strong className="text-slate-700">{task.branch?.bank?.name || "Participating Bank"}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Mandatory Prepared</span>
                      <span>{checkedMandatory} / {mandatoryCount}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#18794E] transition-all"
                        style={{ width: `${Math.round((checkedMandatory / (mandatoryCount || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {missingCount > 0 && (
                    <div className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-100 font-semibold flex items-center gap-1.5">
                      <span>⚠️ {missingCount} document flagged missing</span>
                    </div>
                  )}

                  {task.userNotes && (
                    <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                      &quot;{task.userNotes}&quot;
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Updated {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-xs font-bold text-[#142D4E] hover:text-[#B99A57] flex items-center gap-1"
                  >
                    <span>Open Checklist</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
