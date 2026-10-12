import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { TRAINING_PROGRAMS } from "../data/training";

export default function TrainingSection() {
  return (
    <section className="py-14 md:py-20 bg-white border-t border-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-school-navy tracking-tight mb-8 md:mb-10">
          Đào tạo
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRAINING_PROGRAMS.map((prog) => {
            const isExternal = prog.href.startsWith("http");
            return (
              <Link
                key={prog.name}
                href={prog.href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="group block"
              >
                <Card className="relative h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300">
                  <Image
                    src={prog.image}
                    alt={prog.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-school-navy/95 via-school-navy/35 to-transparent flex items-end p-5">
                    <div className="w-full flex items-center justify-between gap-2 p-3.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm sm:text-base group-hover:bg-epu-orange group-hover:border-transparent transition-all">
                      <span className="line-clamp-1">{prog.name}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
