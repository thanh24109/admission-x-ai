import React from "react";
import Link from "next/link";
import Image from "next/image";
import { STUDENT_ACTIVITIES } from "../data/activities";

export default function StudentActivities() {
  return (
    <section className="epu-section" style={{ backgroundColor: "#ffffff" }}>
      <div className="epu-container">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>
              Hoạt động sinh viên
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.9375rem" }}>
              Sôi nổi các phong trào văn hóa, thể thao, tình nguyện và học thuật của sinh viên EPU
            </p>
          </div>
          <Link
            href="/sinhvien/hoatdongsinhvien"
            style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              color: "var(--color-school-navy)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>Xem tất cả</span>
            <span>→</span>
          </Link>
        </div>

        <div className="epu-spotlight-grid">
          {STUDENT_ACTIVITIES.map((act) => (
            <div key={act.id} className="epu-news-card">
              <Link href={act.link} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div className="epu-news-card-img-wrap">
                  <Image
                    src={act.image}
                    alt={act.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="epu-news-card-img"
                  />
                </div>
                <div className="epu-news-card-body">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span className="epu-category-tag" style={{ marginBottom: 0 }}>
                      {act.category}
                    </span>
                    {act.date && (
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{act.date}</span>
                    )}
                  </div>
                  <h3 className="epu-news-card-title">{act.title}</h3>
                  {act.excerpt && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#64748b",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {act.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
