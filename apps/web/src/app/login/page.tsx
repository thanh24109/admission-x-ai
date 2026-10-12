import type { Metadata } from "next";
import { SplitAuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập | Cổng thông tin tuyển sinh Trường Đại học Điện lực",
  description:
    "Đăng nhập Cổng thông tin tuyển sinh Trường Đại học Điện lực (EPU) để theo dõi hồ sơ, nhận tư vấn và thông báo tuyển sinh mới nhất.",
};

export default function LoginPage() {
  return (
    <SplitAuthLayout mode="login">
      <LoginForm />
    </SplitAuthLayout>
  );
}
