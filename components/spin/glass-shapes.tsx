"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

// Two playful "3D" shapes that flip in opposite directions on entry
// (0.7s, ease-out, like the SVGator intro), then float gently.
// Pure CSS gradients: no WebGL, no images.

const flipEase = [0, 0, 0.58, 1] as const;

export function GlassShapes({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {/* aqua orb */}
      <motion.div
        className="absolute -left-[4%] top-[3%] size-20 sm:left-[14%] sm:top-[14%] sm:size-36 short:left-[2%] short:top-[4%] short:size-16"
        initial={{ rotate: 0, scale: 0.4, opacity: 0 }}
        animate={{ rotate: -180, scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: flipEase }}
      >
        <motion.div
          className="size-full rounded-full bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#3cfffc_22%,#14a5b8_58%,#0b3b52_100%)] shadow-[0_30px_60px_-20px_#3cfffc88,inset_-10px_-14px_30px_#04283a]"
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* navy torus */}
      <motion.div
        className="absolute -right-[6%] bottom-[3%] size-24 sm:bottom-[16%] sm:right-[12%] sm:size-44 short:hidden"
        initial={{ rotate: 0, scale: 0.4, opacity: 0 }}
        animate={{ rotate: 180, scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: flipEase, delay: 0.05 }}
      >
        <motion.div
          className="relative size-full rounded-full bg-[conic-gradient(from_200deg,#192034,#4a5578,#ddf5ff,#192034,#0d1324,#192034)] shadow-[0_30px_70px_-25px_#000]"
          animate={{ y: [0, 12, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-[30%] rounded-full bg-ink shadow-[inset_0_6px_14px_#000,0_0_0_1px_#ffffff22]" />
        </motion.div>
      </motion.div>

      {/* small ice cube */}
      <motion.div
        className="absolute right-[18%] top-[12%] hidden size-14 sm:block"
        initial={{ rotate: 45, opacity: 0, y: -20 }}
        animate={{ rotate: -15, opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: flipEase, delay: 0.2 }}
      >
        <div className="glass-lite relative size-full rounded-2xl">
          <span className="glass-sheen" />
        </div>
      </motion.div>
    </div>
  );
}
