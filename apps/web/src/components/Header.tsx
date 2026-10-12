"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Home, ChevronDown, Menu, X, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NAV_ITEMS, TOPBAR_LINKS } from "@/data/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  const { openSearch, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useAppStore();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <header className="epu-header-wrapper">
      {/* 1. TOPBAR */}
      <div className="epu-topbar">
        <div className="epu-container epu-topbar-inner">
          {/* Left: 60 Năm EPU Gold Badge with motion */}
          <Link href="/post/60-nam-xay-dung-va-phat-trien">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="epu-badge-60 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>60 NĂM EPU</span>
            </motion.div>
          </Link>

          {/* Right: Portal Links + Search Trigger + Language */}
          <div className="epu-topbar-links">
            {TOPBAR_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="epu-topbar-link text-xs transition-colors hover:text-white"
              >
                {link.name}
              </a>
            ))}

            <div className="epu-topbar-divider" />

            {/* Quick Search Button wired to Zustand Store */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={openSearch}
              className="epu-topbar-link flex items-center gap-1.5 font-medium"
              aria-label="Tìm kiếm nhanh"
              title="Tìm kiếm toàn trang"
            >
              <Search size={15} />
              <span className="hidden sm:inline text-xs opacity-90">Tìm kiếm</span>
            </motion.button>

            {/* Language Switcher */}
            <div className="epu-topbar-lang" title="Ngôn ngữ: Tiếng Việt">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  backgroundColor: "#da251d",
                  color: "#ff0",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ★
              </span>
              <span className="font-semibold text-xs">VI</span>
              <ChevronDown size={12} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR */}
      <div className="epu-header">
        <div className="epu-container epu-header-inner">
          {/* Logo & University Name */}
          <Link href="/" className="epu-logo-container group">
            <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
              <Image
                src="/asset/logo-dark.svg"
                alt="Logo Đại học Điện lực"
                width={160}
                height={52}
                className="epu-logo-img"
                priority
              />
              <div className="epu-logo-text">
                <span className="epu-logo-title group-hover:text-school-navy-light transition-colors">
                  ĐẠI HỌC ĐIỆN LỰC
                </span>
                <span className="epu-logo-subtitle">
                  ELECTRIC POWER UNIVERSITY
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="epu-nav">
            {/* Home Icon Button with Motion */}
            <Link href="/" aria-label="Trang chủ" title="Trang chủ">
              <motion.div
                whileHover={{ scale: 1.1, backgroundColor: "#ff6b00" }}
                whileTap={{ scale: 0.95 }}
                className="epu-home-btn"
              >
                <Home size={18} />
              </motion.div>
            </Link>

            <div className="epu-nav-divider" />

            {NAV_ITEMS.filter((item) => item.name !== "Trang chủ").map((item) => (
              <div
                key={item.name}
                className="epu-nav-item"
                onMouseEnter={() => setActiveDropdown(item.name)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href || item.slug || "#"}
                  className="epu-nav-link"
                >
                  <span>{item.name}</span>
                  {item.children && <ChevronDown size={13} className="opacity-60" />}
                </Link>

                {/* Dropdown Menu */}
                {item.children && (
                  <div className="epu-dropdown">
                    {item.children.map((subItem) => (
                      <div key={subItem.name} className="relative">
                        <Link
                          href={subItem.href || "#"}
                          className="epu-dropdown-item"
                          target={subItem.href?.startsWith("http") ? "_blank" : undefined}
                          rel={subItem.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                        >
                          <div className="flex justify-between items-center">
                            <span>{subItem.name}</span>
                            {subItem.children && (
                              <ChevronDown size={12} className="-rotate-90 opacity-50" />
                            )}
                          </div>
                        </Link>

                        {/* Nested Sub-dropdown */}
                        {subItem.children && (
                          <div className="epu-subdropdown">
                            {subItem.children.map((nested) => (
                              <Link
                                key={nested.name}
                                href={nested.href || "#"}
                                className="epu-dropdown-item"
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
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
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
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <Badge variant="default" className="text-xs uppercase font-bold tracking-wider">
                  MENU ĐIỀU HƯỚNG
                </Badge>
                <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                  <X size={20} />
                </Button>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="py-2.5 font-bold text-school-navy border-b border-slate-100 flex items-center gap-2"
                >
                  <Home size={18} className="text-epu-orange" />
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
                          size={16}
                          className={`transition-transform duration-200 ${
                            activeDropdown === item.name ? "rotate-180" : ""
                          }`}
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
