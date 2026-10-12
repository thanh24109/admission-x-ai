import type { Metadata } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

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
    <html lang="vi" className={`${beVietnamPro.variable} ${playfairDisplay.variable}`}>
      <head>
        <link rel="icon" href="/asset/logo-dark.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
