"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, ArrowLeft, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CenteredAuthLayout } from "@/components/auth/AuthLayout";
import { authService } from "@/lib/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const rawEmail = searchParams.get("email") || "";

  // Mask email for privacy (e.g. n***@example.com)
  const maskEmail = (emailStr: string) => {
    if (!emailStr || !emailStr.includes("@")) return "hòm thư của bạn";
    const [userPart, domain] = emailStr.split("@");
    if (userPart.length <= 2) return `${userPart[0]}*@${domain}`;
    return `${userPart[0]}${"*".repeat(Math.max(userPart.length - 2, 3))}${userPart.slice(-1)}@${domain}`;
  };

  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setResendMessage(null);
    try {
      if (rawEmail) {
        await authService.requestPasswordReset(rawEmail);
      }
      setResendMessage("Đã gửi lại email xác nhận thành công!");
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center">
      {/* Visual Envelope with Green Checkmark matching reference screenshot */}
      <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
        {/* Envelope background */}
        <div className="w-20 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Mail className="h-9 w-9 text-white/90" />
        </div>
        {/* Floating Green Check Badge */}
        <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002943] dark:text-white tracking-tight mb-2">
        Kiểm tra email của bạn
      </h1>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
        Chúng tôi đã gửi hướng dẫn xác thực tài khoản tới:
      </p>

      <div className="inline-block px-3 py-1 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
        {rawEmail ? maskEmail(rawEmail) : "địa chỉ email đăng ký"}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
        Vui lòng kiểm tra hộp thư đến (và thư mục Spam/Quảng cáo) để kích hoạt tài khoản hoặc đặt lại mật khẩu.
      </p>

      {resendMessage && (
        <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          {resendMessage}
        </div>
      )}

      <div className="space-y-3">
        {/* Resend button with cooldown */}
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={cooldown > 0 || isResending}
          className="w-full h-10 rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
        >
          {isResending ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>
            {cooldown > 0
              ? `Gửi lại email sau (${cooldown}s)`
              : "Gửi lại email xác nhận"}
          </span>
        </Button>

        {/* Back to Login */}
        <Link
          href="/login"
          className="w-full h-11 rounded-xl bg-[#0866D9] hover:bg-[#0753b3] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <CenteredAuthLayout>
      <Suspense fallback={<div className="text-center p-8 text-sm">Đang tải thông tin...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </CenteredAuthLayout>
  );
}
