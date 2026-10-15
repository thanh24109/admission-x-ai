import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

export const metadata: Metadata = {
  title: "Admin Dashboard | Cổng thông tin tuyển sinh Trường Đại học Điện lực",
  description:
    "Bảng điều khiển quản trị Cổng thông tin tuyển sinh AI - Trường Đại học Điện lực (EPU).",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
