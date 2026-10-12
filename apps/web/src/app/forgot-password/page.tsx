"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CenteredAuthLayout } from "@/components/auth/AuthLayout";
import { authService } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập địa chỉ email của bạn");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng");
      return;
    }

    setIsLoading(true);
    try {
      await authService.requestPasswordReset(trimmedEmail);
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CenteredAuthLayout>
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center">
        {/* Envelope Icon Circle */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Mail className="h-6 w-6" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002943] dark:text-white tracking-tight mb-2">
          Quên mật khẩu?
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
          Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
        </p>

        {isSubmitted ? (
          <div className="space-y-5 text-left">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                Nếu tài khoản với email <span className="font-bold underline">{email}</span> tồn tại trong hệ thống, chúng tôi đã gửi liên kết hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/verify-email?email=${encodeURIComponent(email)}`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0866D9] hover:bg-[#0753b3] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>Xem trạng thái xác nhận</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại đăng nhập</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="forgot-email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="nhap.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 h-11 text-sm rounded-xl ${
                    emailError ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  disabled={isLoading}
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 font-medium">{emailError}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#0866D9] hover:bg-[#0753b3] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang gửi hướng dẫn...</span>
                </>
              ) : (
                <>
                  <span>Gửi hướng dẫn</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Quay lại đăng nhập</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </CenteredAuthLayout>
  );
}
