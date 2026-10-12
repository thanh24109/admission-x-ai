import type { Metadata } from "next";
import { SplitAuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản | Cổng thông tin tuyển sinh Trường Đại học Điện lực",
  description:
    "Đăng ký tài khoản Thí sinh / Phụ huynh tại Cổng thông tin tuyển sinh Trường Đại học Điện lực (EPU).",
};

export default function RegisterPage() {
  return (
    <SplitAuthLayout mode="register">
      <RegisterForm />
    </SplitAuthLayout>
  );
}
