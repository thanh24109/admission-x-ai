import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, Printer, MapPin, ExternalLink } from "lucide-react";
import { EPU_FOOTER } from "../data/footer";

export default function Footer() {
  return (
    <footer className="epu-footer">
      <div className="epu-container">
        <div className="epu-footer-grid">
          {/* Column 1: Logo & Socials & About */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/asset/logo-full-light.svg"
                alt="Logo Trường Đại học Điện lực"
                width={260}
                height={75}
                className="epu-footer-logo"
              />
            </Link>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              Trường Đại học Điện lực là trường đại học công lập đa ngành, định hướng ứng dụng, trực thuộc Bộ Công Thương, đào tạo nguồn nhân lực chất lượng cao phục vụ ngành năng lượng và nền kinh tế quốc dân.
            </p>

            <div className="epu-footer-socials">
              {/* Facebook */}
              <a
                href={EPU_FOOTER.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="epu-social-icon"
                aria-label="Facebook EPU"
                title="Facebook EPU"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Zalo */}
              <a
                href={EPU_FOOTER.socials.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className="epu-social-icon"
                aria-label="Zalo EPU"
                title="Zalo Official EPU"
              >
                <span style={{ fontWeight: 800, fontSize: "0.75rem", letterSpacing: "-0.05em" }}>Zalo</span>
              </a>
            </div>
          </div>

          {/* Column 2: 4 Campuses */}
          <div>
            <div className="epu-footer-heading">Thông tin các cơ sở</div>
            <div className="epu-campus-list">
              {EPU_FOOTER.campuses.map((campus) => (
                <div key={campus.label} className="epu-campus-item">
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <MapPin size={16} style={{ color: "var(--color-epu-orange)", flexShrink: 0, marginTop: "3px" }} />
                    <div>
                      <strong>{campus.label}:</strong>
                      <span>{campus.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Contact & Statistics */}
          <div>
            <div className="epu-footer-heading">Thông tin liên hệ</div>

            <div className="epu-contact-item">
              <Phone size={16} style={{ color: "var(--color-epu-orange)", flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: "0.75rem", display: "block", color: "rgba(255,255,255,0.6)" }}>ĐT Tuyển sinh</span>
                <strong>{EPU_FOOTER.contacts.admissionHotline}</strong>
              </div>
            </div>

            <div className="epu-contact-item">
              <Phone size={16} style={{ color: "var(--color-epu-orange)", flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: "0.75rem", display: "block", color: "rgba(255,255,255,0.6)" }}>Phòng TC - HC</span>
                <strong>{EPU_FOOTER.contacts.adminPhone}</strong>
              </div>
            </div>

            <div className="epu-contact-item">
              <Printer size={16} style={{ color: "var(--color-epu-orange)", flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: "0.75rem", display: "block", color: "rgba(255,255,255,0.6)" }}>FAX</span>
                <span>{EPU_FOOTER.contacts.fax}</span>
              </div>
            </div>

            <div className="epu-contact-item">
              <Mail size={16} style={{ color: "var(--color-epu-orange)", flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: "0.75rem", display: "block", color: "rgba(255,255,255,0.6)" }}>Email</span>
                <a href={`mailto:${EPU_FOOTER.contacts.email}`} style={{ textDecoration: "underline" }}>
                  {EPU_FOOTER.contacts.email}
                </a>
              </div>
            </div>

            {/* Quick Link to Partners */}
            <div style={{ marginTop: "1rem" }}>
              <a
                href="/page/doi-tac-phat-trien"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.8125rem",
                  color: "#fed7aa",
                }}
              >
                <span>Danh sách các đối tác</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Visitor Stats */}
            <div className="epu-stats-grid">
              <div>
                <div className="epu-stat-value">{EPU_FOOTER.stats.online}</div>
                <div className="epu-stat-label">Online</div>
              </div>
              <div>
                <div className="epu-stat-value">{EPU_FOOTER.stats.today}</div>
                <div className="epu-stat-label">Hôm nay</div>
              </div>
              <div>
                <div className="epu-stat-value">{EPU_FOOTER.stats.total}</div>
                <div className="epu-stat-label">Tổng truy cập</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="epu-footer-bottom">
          <div>
            © {new Date().getFullYear()} Trường Đại học Điện lực (Electric Power University). Bản quyền thuộc về EPU.
          </div>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/page/lich-su-truyen-thong">Giới thiệu</Link>
            <Link href="/tuyensinh">Tuyển sinh</Link>
            <Link href="/tintuc/thongbao">Thông báo</Link>
            <Link href="/page/bo-nhan-dien-thuong-hieu">Nhận diện thương hiệu</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
