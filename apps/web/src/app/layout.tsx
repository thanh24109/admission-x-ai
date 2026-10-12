import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
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
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/asset/logo-dark.svg" type="image/svg+xml" />
      </head>
      <body className="font-sans antialiased text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
