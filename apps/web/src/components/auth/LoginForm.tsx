"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordField } from "@/components/auth/PasswordField";
import { DevelopmentQuickLogin } from "@/components/auth/DevelopmentQuickLogin";
import { authService, getRedirectPathForRole } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Validation & status states
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập email của bạn");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Vui lòng nhập mật khẩu");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Mật khẩu phải có ít nhất 6 ký tự");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
        rememberMe,
      });

      // Redirect strictly based on the server-authenticated role
      const redirectPath = getRedirectPathForRole(response.user.role);
      router.push(redirectPath);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto z-10 relative">
      {/* Header section matching exact reference typography */}
      <div className="text-center mb-7">
        <h2 className="text-[34px] sm:text-[38px] font-extrabold text-[#0B1D49] dark:text-white tracking-tight leading-tight">
          Đăng nhập
        </h2>
        <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-2.5 max-w-[340px] mx-auto leading-relaxed font-normal">
          Chào mừng bạn quay lại với Cổng thông tin tuyển sinh Trường Đại học Điện lực.
        </p>
      </div>

      {/* Global alert for errors */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 h-12 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400 transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 ${
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

        {/* Password Field */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Mật khẩu
          </Label>
          <div className="relative">
            <PasswordField
              id="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 placeholder:text-slate-400 transition-shadow focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
              error={passwordError ?? undefined}
              disabled={isLoading}
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {passwordError && (
            <p className="text-xs text-red-500 font-medium">{passwordError}</p>
          )}
        </div>

        {/* Remember Me & Forgot Password Row */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="remember" className="text-slate-600 dark:text-slate-400 cursor-pointer select-none text-xs font-normal">
              Ghi nhớ đăng nhập
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-[#0866D9] dark:text-blue-400 font-medium hover:underline text-xs"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Primary Submit Button: 52px height, #0866D9, white text, arrow right */}
        <Button
          type="submit"
          className="w-full h-12 rounded-xl bg-[#0866D9] hover:bg-[#0756C9] text-white font-semibold text-sm shadow-md shadow-blue-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Development Quick Login Section (Mock Auth - Development Only) */}
      <DevelopmentQuickLogin />

      {/* Social login divider: "hoặc đăng nhập với" */}
      <div className="relative my-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-normal">
            hoặc đăng nhập với
          </span>
        </div>
      </div>

      {/* Google and Microsoft login buttons matching reference mockup */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setError("Tính năng đăng nhập Google đang được kết nối trong hệ thống.");
          }}
          className="flex items-center justify-center gap-2.5 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setError("Tính năng đăng nhập Microsoft đang được kết nối trong hệ thống.");
          }}
          className="flex items-center justify-center gap-2.5 h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          <span>Microsoft</span>
        </button>
      </div>

      {/* Switch to Register link: Soft rounded banner panel */}
      <div className="py-3 px-4 rounded-xl bg-[#F0F5FA] dark:bg-slate-800/50 text-center border border-slate-200/50 dark:border-slate-800">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-[#0866D9] dark:text-blue-400 font-bold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
