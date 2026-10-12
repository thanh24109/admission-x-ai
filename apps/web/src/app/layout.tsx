import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cổng thông tin điện tử Trường Đại học Điện lực | EPU - Electric Power University",
  description:
    "Cổng thông tin điện tử chính thức của Trường Đại học Điện lực (EPU). Cập nhật nhanh chóng tin tức, sự kiện, thông tin tuyển sinh, đào tạo và các hoạt động của sinh viên.",
  icons: {
    icon: "/asset/logo-dark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/asset/logo-dark.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased text-slate-800 bg-white">{children}</body>
    </html>
  );
}
