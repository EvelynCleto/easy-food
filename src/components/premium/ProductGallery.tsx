import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/format";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  if (images.length === 0) return <div className="aspect-[16/10] bg-muted" />;
  const src = images[active];

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[16/10] cursor-zoom-in overflow-hidden rounded-3xl bg-muted"
        onClick={() => setZoom(true)}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={src}
            src={src}
            alt={alt}
            initial={{ opacity: 0.4, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={cn(
                "press h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-2 transition",
                i === active ? "ring-primary" : "ring-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur"
          >
            <motion.img
              src={src}
              alt={alt}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}