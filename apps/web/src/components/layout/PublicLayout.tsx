"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchModal from "@/components/SearchModal";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header />
      <main className="flex-1 bg-slate-50 dark:bg-slate-950">{children}</main>
      <Footer />
      <SearchModal />
    </div>
  );
}
