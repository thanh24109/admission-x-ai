"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordField } from "@/components/auth/PasswordField";
import { authService } from "@/lib/auth";

export function RegisterForm() {
  const router = useRouter();

  // Form input states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Error & Status states
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    setFullNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setTermsError(null);
    setGeneralError(null);

    if (!fullName.trim()) {
      setFullNameError("Vui lòng nhập họ và tên của bạn");
      isValid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Vui lòng nhập địa chỉ email");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Địa chỉ email không đúng định dạng");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Vui lòng tạo mật khẩu");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp");
      isValid = false;
    }

    if (!agreeTerms) {
      setTermsError("Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      await authService.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        confirmPassword,
        agreeTerms,
      });

      // Redirect to verification screen on success
      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Đăng ký không thành công. Vui lòng thử lại sau.";
      setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Header text */}
      <div className="mb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#002943] dark:text-white tracking-tight">
          Đăng ký tài khoản
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          Tham gia Cổng thông tin tuyển sinh Trường Đại học Điện lực
        </p>
      </div>

      {/* Blue Notice Badge from Mockup */}
      <div className="mb-4 p-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
          i
        </div>
        <div className="leading-snug">
          <span className="font-bold">Dành cho thí sinh/phụ huynh</span>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            Cán bộ tuyển sinh và quản trị viên được cấp tài khoản bởi Nhà trường.
          </p>
        </div>
      </div>

      {generalError && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="fullName" className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Họ và tên
          </Label>
          <div className="relative">
            <Input
              id="fullName"
              type="text"
              placeholder="Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`pl-10 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 placeholder:text-slate-400 ${
                fullNameError ? "border-red-500 focus-visible:ring-red-500" : ""
              }`}
              disabled={isLoading}
            />
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {fullNameError && (
            <p className="text-xs text-red-500 font-medium">{fullNameError}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Email
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="nhap.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`pl-10 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 placeholder:text-slate-400 ${
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

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone" className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Số điện thoại
          </Label>
          <div className="relative">
            <Input
              id="phone"
              type="tel"
              placeholder="0901 234 567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Mật khẩu
          </Label>
          <div className="relative">
            <PasswordField
              id="password"
              placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 placeholder:text-slate-400"
              error={passwordError ?? undefined}
              disabled={isLoading}
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {passwordError && (
            <p className="text-xs text-red-500 font-medium">{passwordError}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Xác nhận mật khẩu
          </Label>
          <div className="relative">
            <PasswordField
              id="confirmPassword"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-10 text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 placeholder:text-slate-400"
              error={confirmPasswordError ?? undefined}
              disabled={isLoading}
            />
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
          {confirmPasswordError && (
            <p className="text-xs text-red-500 font-medium">{confirmPasswordError}</p>
          )}
        </div>

        {/* Terms agreement checkbox */}
        <div className="pt-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5"
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-600 dark:text-slate-400 select-none leading-relaxed">
              Tôi đồng ý với{" "}
              <Link href="/terms" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Điều khoản sử dụng
              </Link>{" "}
              và{" "}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                Chính sách bảo mật
              </Link>
            </label>
          </div>
          {termsError && (
            <p className="text-xs text-red-500 font-medium mt-1">{termsError}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 mt-2 rounded-xl bg-[#0866D9] hover:bg-[#0756b8] text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <>
              <span>Tạo tài khoản</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to login link */}
      <div className="mt-5 text-center">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
