import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STUDENT_ACTIVITIES } from "../data/activities";

export default function StudentActivities() {
  return (
    <section className="py-14 md:py-20 bg-slate-50/70 border-t border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
                ĐỜI SỐNG HỌC ĐƯỜNG
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-school-navy tracking-tight mb-2">
              Hoạt động sinh viên
            </h2>
            <p className="text-slate-600 text-sm max-w-xl">
              Sôi nổi các phong trào văn hóa, thể thao, tình nguyện và học thuật của sinh viên EPU
            </p>
          </div>
          <Button variant="outline" asChild className="rounded-full gap-2 border-slate-200 hover:bg-slate-100 bg-white">
            <Link href="/sinhvien/hoatdongsinhvien">
              <span className="text-xs uppercase font-bold tracking-wider">Xem tất cả</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STUDENT_ACTIVITIES.map((act) => (
            <Card
              key={act.id}
              className="rounded-2xl border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden bg-white group flex flex-col"
            >
              <Link href={act.link} className="flex flex-col h-full">
                <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                  <Image
                    src={act.image}
                    alt={act.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="font-bold text-xs text-epu-orange uppercase tracking-wider">
                        {act.category}
                      </span>
                      {act.date && (
                        <span className="text-xs text-slate-400">{act.date}</span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-school-navy line-clamp-2 transition-colors leading-snug mb-2">
                      {act.title}
                    </h3>
                    {act.excerpt && (
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {act.excerpt}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
