"use client";

import React from "react";
import Image from "next/image";
import { Play, Video } from "lucide-react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { MEDIA_DATA } from "@/data/media";

export default function MediaSection() {
  const { activeVideo, setActiveVideo } = useAppStore();

  return (
    <section className="py-16 md:py-24 bg-white border-t border-slate-200/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
            VIDEO NỔI BẬT
          </Badge>
        </div>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-school-navy tracking-tight mb-8 md:mb-10">
          Media & Giới thiệu EPU
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MEDIA_DATA.map((vid) => (
            <motion.div
              key={vid.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="h-full cursor-pointer"
              onClick={() => setActiveVideo(vid)}
              role="button"
              tabIndex={0}
            >
              <Card className="h-full rounded-2xl border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden bg-white group flex flex-col">
                <div className="relative w-full aspect-video overflow-hidden bg-slate-900">
                  <Image
                    src={vid.poster}
                    alt={vid.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                    <motion.div
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 rounded-full bg-epu-orange text-white flex items-center justify-center shadow-lg shadow-orange-500/40"
                      aria-label="Phát video"
                    >
                      <Play className="h-6 w-6 fill-white ml-0.5" />
                    </motion.div>
                  </div>
                </div>

                <CardContent className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-epu-orange border-epu-orange/40 mb-2.5">
                      {vid.label}
                    </Badge>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-school-navy transition-colors line-clamp-2 leading-snug mb-2">
                      {vid.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {vid.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Video Player Modal using Radix Dialog */}
        <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
          <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden bg-black border-none rounded-2xl shadow-2xl">
            {activeVideo && (
              <>
                <DialogHeader className="p-4 bg-slate-900 text-white border-b border-slate-800">
                  <DialogTitle className="text-base text-white flex items-center gap-2 line-clamp-1">
                    <Video className="h-4 w-4 text-epu-orange shrink-0" />
                    <span>{activeVideo.title}</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1`}
                    title={activeVideo.title}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
