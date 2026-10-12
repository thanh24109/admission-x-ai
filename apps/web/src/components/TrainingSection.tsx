import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { TRAINING_PROGRAMS } from "../data/training";

export default function TrainingSection() {
  return (
    <section className="epu-section" style={{ backgroundColor: "#ffffff" }}>
      <div className="epu-container">
        <h2 className="section-title">Đào tạo</h2>

        <div className="epu-training-grid">
          {TRAINING_PROGRAMS.map((prog) => {
            const isExternal = prog.href.startsWith("http");
            return (
              <Link
                key={prog.name}
                href={prog.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="epu-training-card"
              >
                <Image
                  src={prog.image}
                  alt={prog.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="epu-training-bg"
                />
                <div className="epu-training-overlay">
                  <div className="epu-training-pill">
                    <span>{prog.name}</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
