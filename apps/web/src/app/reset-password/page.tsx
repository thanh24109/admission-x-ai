"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Lock, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/PasswordField";
import { CenteredAuthLayout } from "@/components/auth/AuthLayout";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    let isValid = true;
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu mới");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu mới");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!token) {
      setGeneralError(
        "Mã xác thực không hợp lệ hoặc đã hết hạn. Vui lòng gửi lại yêu cầu đặt lại mật khẩu."
      );
      return;
    }

    setIsLoading(true);
    try {
      const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const res = await fetch(`${api}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        throw new Error("Không thể cập nhật mật khẩu hoặc liên kết đã hết hạn.");
      }
      setIsSuccess(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.";
      setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 text-center">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
        <KeyRound className="h-6 w-6" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002943] dark:text-white tracking-tight mb-2">
        Đặt lại mật khẩu
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
        Tạo mật khẩu mới an toàn cho tài khoản của bạn.
      </p>

      {isSuccess ? (
        <div className="space-y-5 text-left">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              Mật khẩu của bạn đã được thay đổi thành công! Bạn có thể đăng nhập ngay bằng mật khẩu mới.
            </div>
          </div>

          <Link
            href="/login"
            className="w-full h-11 rounded-xl bg-[#0866D9] hover:bg-[#0753b3] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
          {generalError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mật khẩu mới
            </Label>
            <div className="relative">
              <PasswordField
                id="new-password"
                placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-11 text-sm rounded-xl"
                error={passwordError ?? undefined}
                disabled={isLoading}
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {passwordError && (
              <p className="text-xs text-red-500 font-medium">{passwordError}</p>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Xác nhận mật khẩu mới
            </Label>
            <div className="relative">
              <PasswordField
                id="confirm-new-password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 h-11 text-sm rounded-xl"
                error={confirmPasswordError ?? undefined}
                disabled={isLoading}
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            {confirmPasswordError && (
              <p className="text-xs text-red-500 font-medium">{confirmPasswordError}</p>
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
                <span>Đang cập nhật...</span>
              </>
            ) : (
              <>
                <span>Cập nhật mật khẩu</span>
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
  );
}

export default function ResetPasswordPage() {
  return (
    <CenteredAuthLayout>
      <Suspense fallback={<div className="text-center p-8 text-sm">Đang tải...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </CenteredAuthLayout>
  );
}
