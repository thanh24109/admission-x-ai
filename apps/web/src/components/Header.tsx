"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Home, ChevronDown, Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NAV_ITEMS, TOPBAR_LINKS } from "@/data/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Header() {
  const { openSearch, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useAppStore();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "shadow-md" : ""
      )}
    >
      {/* 1. TOPBAR - Utility bar */}
      <div
        className={cn(
          "bg-school-navy text-white text-xs border-b border-white/10 transition-all duration-300 overflow-hidden",
          isScrolled
            ? "max-h-0 opacity-0 py-0 border-transparent pointer-events-none"
            : "max-h-12 opacity-100 py-1"
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-10">
          {/* Left: 60 Năm EPU Gold Badge with motion */}
          <Link href="/post/60-nam-xay-dung-va-phat-trien">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-900 to-amber-950 border border-amber-500/60 text-amber-300 font-bold text-[11px] px-2.5 py-1 rounded-full uppercase tracking-wider hover:shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>60 NĂM EPU</span>
            </motion.div>
          </Link>

          {/* Right: Portal Links + Search Trigger + Language */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-4">
              {TOPBAR_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/85 text-xs hover:text-white transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <Separator orientation="vertical" className="hidden md:block h-3.5 bg-white/20" />

            {/* Quick Search Button wired to Zustand Store */}
            <Button
              variant="ghost"
              size="sm"
              onClick={openSearch}
              className="h-8 px-2.5 text-white/90 hover:text-white hover:bg-white/10 gap-1.5 text-xs font-medium"
              aria-label="Tìm kiếm nhanh"
              title="Tìm kiếm toàn trang"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tìm kiếm</span>
            </Button>

            {/* Language Switcher */}
            <div
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors cursor-pointer text-xs font-semibold"
              title="Ngôn ngữ: Tiếng Việt"
            >
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-yellow-300 text-[10px] font-bold">
                ★
              </span>
              <span>VI</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div
        className={cn(
          "transition-all duration-300 border-b border-slate-200/80",
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-md"
            : "bg-white shadow-sm"
        )}
      >
        <div
          className={cn(
            "container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300",
            isScrolled ? "h-[70px]" : "h-[84px]"
          )}
        >
          {/* Logo & University Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
              <Image
                src="/asset/logo-dark.svg"
                alt="Logo Đại học Điện lực"
                width={160}
                height={52}
                className={cn(
                  "w-auto object-contain transition-all duration-300",
                  isScrolled ? "h-11" : "h-[50px]"
                )}
                priority
              />
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base md:text-lg text-school-navy tracking-tight leading-tight uppercase group-hover:text-school-navy-light transition-colors">
                  ĐẠI HỌC ĐIỆN LỰC
                </span>
                <span className="font-bold text-[10px] sm:text-xs text-slate-500 tracking-wider uppercase leading-tight">
                  ELECTRIC POWER UNIVERSITY
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Home Icon Button */}
            <Button
              variant="default"
              size="icon"
              asChild
              className="rounded-full bg-school-navy hover:bg-epu-orange text-white h-9 w-9 shadow-sm transition-transform duration-200 hover:scale-105"
            >
              <Link href="/" aria-label="Trang chủ" title="Trang chủ">
                <Home className="h-4 w-4" />
              </Link>
            </Button>

            <Separator orientation="vertical" className="h-5 mx-1.5 bg-slate-200" />

            {NAV_ITEMS.filter((item) => item.name !== "Trang chủ").map((item) => (
              <div
                key={item.name}
                className="relative group"
                onMouseEnter={() => setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href || item.slug || "#"}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-school-navy hover:text-epu-orange hover:bg-slate-50/80 rounded-lg transition-colors"
                >
                  <span>{item.name}</span>
                  {item.children && <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                </Link>

                {/* Dropdown Menu with Tailwind & Shadcn elevation */}
                {item.children && (
                  <div className="absolute top-full left-0 min-w-[260px] bg-white rounded-xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                    {item.children.map((subItem) => (
                      <div key={subItem.name} className="relative group/sub">
                        <Link
                          href={subItem.href || "#"}
                          className="flex justify-between items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-epu-orange hover:bg-slate-50 transition-colors"
                          target={subItem.href?.startsWith("http") ? "_blank" : undefined}
                          rel={subItem.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          <span>{subItem.name}</span>
                          {subItem.children && (
                            <ChevronDown className="h-3.5 w-3.5 -rotate-90 opacity-40" />
                          )}
                        </Link>

                        {/* Nested Sub-dropdown */}
                        {subItem.children && (
                          <div className="absolute top-0 left-full min-w-[240px] bg-white rounded-xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible translate-x-2 group-hover/sub:opacity-100 group-hover/sub:visible group-hover/sub:translate-x-0 transition-all duration-200 z-50">
                            {subItem.children.map((nested) => (
                              <Link
                                key={nested.name}
                                href={nested.href || "#"}
                                className="block px-4 py-2 text-sm font-medium text-slate-700 hover:text-epu-orange hover:bg-slate-50 transition-colors"
                              >
                                {nested.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Mobile Hamburger Button with Shadcn Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Menu di động"
              className="text-school-navy"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 3. MOBILE MENU DRAWER with AnimatePresence */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={closeMobileMenu}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-white p-6 overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
                  MENU ĐIỀU HƯỚNG
                </Badge>
                <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="py-2.5 font-bold text-school-navy border-b border-slate-100 flex items-center gap-2"
                >
                  <Home className="h-4 w-4 text-epu-orange" />
                  <span>Trang chủ</span>
                </Link>

                {NAV_ITEMS.filter((item) => item.name !== "Trang chủ").map((item) => (
                  <div key={item.name} className="border-b border-slate-100">
                    <div
                      className="flex justify-between items-center py-2.5 font-semibold text-slate-800 cursor-pointer"
                      onClick={() => toggleDropdown(item.name)}
                    >
                      <span>{item.name}</span>
                      {item.children && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            activeDropdown === item.name ? "rotate-180" : ""
                          )}
                        />
                      )}
                    </div>
                    {item.children && activeDropdown === item.name && (
                      <div className="pl-4 pb-2 space-y-1">
                        {item.children.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href || "#"}
                            onClick={closeMobileMenu}
                            className="block py-1.5 text-sm text-slate-600 hover:text-epu-orange"
                          >
                            • {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
