"use client";

import React from "react";
import Image from "next/image";
import { Play, Video } from "lucide-react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { MEDIA_DATA } from "@/data/media";

export default function MediaSection() {
  const { activeVideo, setActiveVideo } = useAppStore();

  return (
    <section className="epu-section bg-slate-50/60 border-t border-slate-200/60">
      <div className="epu-container">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs uppercase font-bold tracking-wider">
            VIDEO NỔI BẬT
          </Badge>
        </div>
        <h2 className="section-title">Media & Giới thiệu EPU</h2>

        <div className="epu-media-grid">
          {MEDIA_DATA.map((vid) => (
            <motion.div
              key={vid.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="epu-video-card group cursor-pointer"
              onClick={() => setActiveVideo(vid)}
              role="button"
              tabIndex={0}
            >
              <div className="epu-video-poster-wrap relative overflow-hidden">
                <Image
                  src={vid.poster}
                  alt={vid.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="epu-video-poster group-hover:scale-105 transition-transform duration-500"
                />
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className="epu-play-btn"
                  aria-label="Phát video"
                >
                  <Play size={24} fill="#ffffff" />
                </motion.div>
              </div>

              <div className="epu-video-body">
                <Badge variant="outline" className="text-[10px] uppercase font-bold text-epu-orange border-epu-orange/40 mb-2">
                  {vid.label}
                </Badge>
                <h3 className="epu-video-title group-hover:text-school-navy transition-colors">
                  {vid.title}
                </h3>
                <p className="epu-video-desc">{vid.description}</p>
              </div>
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
