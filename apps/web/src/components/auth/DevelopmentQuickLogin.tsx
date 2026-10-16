"use client";

import React from "react";
import { ShieldCheck, GraduationCap, Terminal, ArrowRight, CheckCircle2 } from "lucide-react";
import { useMockAuth } from "@/lib/mockAuth";

export function DevelopmentQuickLogin() {
  const {
    isMockEnabled,
    loginAsAdmin,
    loginAsCandidate,
    user,
    role,
    isAuthenticated,
    isMock,
  } = useMockAuth();

  // STRICT REQUIREMENT: Hide completely when Mock Auth is disabled or in production
  if (!isMockEnabled) {
    return null;
  }

  return (
    <div className="my-6 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-[#F4F8FD] dark:bg-[#0D1C34] shadow-xs transition-all">
      {/* Header with Dev Indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#0866D9]/10 text-[#0866D9] dark:text-[#388BFD]">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#0B1D49] dark:text-white uppercase tracking-wider">
            Development Quick Login
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          MOCK AUTH
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5 leading-relaxed">
        Chọn vai trò để đăng nhập nhanh vào hệ thống kiểm thử giao diện:
      </p>

      {/* Quick Login Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Login as Admin */}
        <button
          type="button"
          onClick={loginAsAdmin}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer ${
            isAuthenticated && isMock && role === "ADMIN"
              ? "bg-[#0B1D49] text-white border-[#0B1D49] shadow-sm ring-2 ring-blue-400/40"
              : "bg-white dark:bg-[#122442] hover:bg-slate-50 dark:hover:bg-[#172D52] border-slate-200 dark:border-slate-700 text-[#0B1D49] dark:text-white shadow-2xs hover:border-[#0866D9]/50"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isAuthenticated && isMock && role === "ADMIN"
                  ? "bg-white/20 text-white"
                  : "bg-blue-50 dark:bg-blue-950/50 text-[#0866D9] dark:text-[#388BFD]"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">Login as Admin</span>
              <span
                className={`text-[10px] truncate ${
                  isAuthenticated && isMock && role === "ADMIN"
                    ? "text-blue-200"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                admin@mock.local
              </span>
            </div>
          </div>
          <ArrowRight
            className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
              isAuthenticated && isMock && role === "ADMIN" ? "text-white" : "text-slate-400"
            }`}
          />
        </button>

        {/* Login as Candidate */}
        <button
          type="button"
          onClick={loginAsCandidate}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group cursor-pointer ${
            isAuthenticated && isMock && role === "CANDIDATE"
              ? "bg-[#0866D9] text-white border-[#0866D9] shadow-sm ring-2 ring-blue-400/40"
              : "bg-white dark:bg-[#122442] hover:bg-slate-50 dark:hover:bg-[#172D52] border-slate-200 dark:border-slate-700 text-[#0B1D49] dark:text-white shadow-2xs hover:border-[#0866D9]/50"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isAuthenticated && isMock && role === "CANDIDATE"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">Login as Candidate</span>
              <span
                className={`text-[10px] truncate ${
                  isAuthenticated && isMock && role === "CANDIDATE"
                    ? "text-blue-200"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                candidate@mock.local
              </span>
            </div>
          </div>
          <ArrowRight
            className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${
              isAuthenticated && isMock && role === "CANDIDATE" ? "text-white" : "text-slate-400"
            }`}
          />
        </button>
      </div>

      {/* Active Session Status */}
      {isAuthenticated && isMock && user && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Đang đăng nhập: <strong>{user.name}</strong> ({role})
            </span>
          </div>
          <button
            type="button"
            onClick={() => (role === "ADMIN" ? loginAsAdmin() : loginAsCandidate())}
            className="text-[#0866D9] dark:text-[#388BFD] font-semibold hover:underline"
          >
            Vào bảng điều khiển →
          </button>
        </div>
      )}
    </div>
  );
}
