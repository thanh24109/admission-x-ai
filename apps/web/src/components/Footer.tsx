import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Printer, MapPin, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { EPU_FOOTER } from "../data/footer";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-school-navy text-white pt-16 pb-8 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Column 1: Logo & Socials & About */}
          <div className="lg:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/asset/logo-full-light.svg"
                alt="Logo Trường Đại học Điện lực"
                width={260}
                height={75}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/75 leading-relaxed">
              Trường Đại học Điện lực là trường đại học công lập đa ngành, định hướng ứng dụng, trực thuộc Bộ Công Thương, đào tạo nguồn nhân lực chất lượng cao phục vụ ngành năng lượng và nền kinh tế quốc dân.
            </p>

            <div className="flex items-center gap-3 pt-2">
              {/* Facebook */}
              <a
                href={EPU_FOOTER.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-epu-orange flex items-center justify-center transition-colors text-white"
                aria-label="Facebook EPU"
                title="Facebook EPU"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Zalo */}
              <a
                href={EPU_FOOTER.socials.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-epu-orange flex items-center justify-center transition-colors text-white font-bold text-xs"
                aria-label="Zalo EPU"
                title="Zalo Official EPU"
              >
                <span>Zalo</span>
              </a>
            </div>
          </div>

          {/* Column 2: 4 Campuses */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white tracking-wider uppercase border-b border-white/15 pb-2.5">
              Thông tin các cơ sở
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EPU_FOOTER.campuses.map((campus) => (
                <div key={campus.label} className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 flex gap-3 items-start">
                  <MapPin className="h-5 w-5 text-epu-orange shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    <strong className="block text-white font-semibold mb-0.5">{campus.label}:</strong>
                    <span>{campus.address}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Contact & Statistics */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white tracking-wider uppercase border-b border-white/15 pb-2.5">
              Thông tin liên hệ
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <Phone className="h-4 w-4 text-epu-orange shrink-0" />
                <div>
                  <span className="text-[11px] block text-white/50">ĐT Tuyển sinh</span>
                  <strong className="text-white">{EPU_FOOTER.contacts.admissionHotline}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <Phone className="h-4 w-4 text-epu-orange shrink-0" />
                <div>
                  <span className="text-[11px] block text-white/50">Phòng TC - HC</span>
                  <strong className="text-white">{EPU_FOOTER.contacts.adminPhone}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <Printer className="h-4 w-4 text-epu-orange shrink-0" />
                <div>
                  <span className="text-[11px] block text-white/50">FAX</span>
                  <span>{EPU_FOOTER.contacts.fax}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                <Mail className="h-4 w-4 text-epu-orange shrink-0" />
                <div>
                  <span className="text-[11px] block text-white/50">Email liên hệ</span>
                  <span>{EPU_FOOTER.contacts.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.05] border border-white/10 text-center mt-4">
              <div>
                <div className="text-base font-extrabold text-epu-orange">60+</div>
                <div className="text-[10px] text-white/60 uppercase">Năm đào tạo</div>
              </div>
              <div>
                <div className="text-base font-extrabold text-epu-orange">13</div>
                <div className="text-[10px] text-white/60 uppercase">Khoa chuyên môn</div>
              </div>
              <div>
                <div className="text-base font-extrabold text-epu-orange">100%</div>
                <div className="text-[10px] text-white/60 uppercase">Đạt chuẩn KĐCL</div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10 my-6" />

        {/* Footer Bottom copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/60">
          <div>
            © {new Date().getFullYear()} Trường Đại học Điện lực. Tất cả quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href="/sitemap" className="hover:text-white transition-colors">
              Sơ đồ trang
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
