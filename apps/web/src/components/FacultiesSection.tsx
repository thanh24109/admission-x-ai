"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { FACULTIES_DATA } from "../data/faculties";

export default function FacultiesSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  return (
    <section className="epu-section" style={{ backgroundColor: "#ffffff" }}>
      <div className="epu-container">
        {/* Header with Title and Nav Arrows */}
        <div className="epu-faculties-header">
          <h2 className="section-title" style={{ marginBottom: 0 }}>
            Các khoa đào tạo
          </h2>
          <div className="epu-slider-arrows">
            <button
              onClick={scrollLeft}
              className="epu-arrow-nav-btn"
              aria-label="Khoa trước"
              title="Khoa trước"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={scrollRight}
              className="epu-arrow-nav-btn"
              aria-label="Khoa tiếp theo"
              title="Khoa tiếp theo"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div className="epu-faculties-track" ref={trackRef}>
          {FACULTIES_DATA.map((faculty) => (
            <div key={faculty.name} className="epu-faculty-card">
              <div className="epu-faculty-img-wrap">
                <Image
                  src={faculty.image}
                  alt={faculty.name}
                  fill
                  sizes="310px"
                  className="epu-faculty-img"
                />
                <div className="epu-faculty-overlay">
                  <h3 className="epu-faculty-title-overlay">{faculty.name}</h3>
                </div>
              </div>

              <div className="epu-faculty-body">
                <p className="epu-faculty-desc">{faculty.description}</p>
                <a
                  href={faculty.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="epu-faculty-link"
                >
                  <span>Khám phá khoa</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
