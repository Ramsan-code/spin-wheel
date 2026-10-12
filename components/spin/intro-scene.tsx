"use client";

import { motion, type Variants } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EASE_OUT_EXPO } from "./easing";
import { GlassShapes } from "./glass-shapes";

type Props = {
  brand: string;
  headline: string;
  tagline: string;
  onStart: () => void;
};

// Liquid-glass title card: brand, headline and tagline arrive as three glass
// cards between the 3D shapes (after the SVGator "marketing intro" template).
export function IntroScene({ brand, headline, tagline, onStart }: Props) {
  const card: Variants = {
    hidden: { opacity: 0, y: 40, rotateX: -35, filter: "blur(10px)" },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: "blur(0px)",
      transition: { delay: 0.45 + i * 0.16, duration: 0.8, ease: EASE_OUT_EXPO },
    }),
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-16 short:py-4">
      <GlassShapes />

      <motion.div
        initial="hidden"
        animate="show"
        className="relative flex w-full max-w-xl flex-col items-center gap-4 [perspective:1000px] short:gap-2"
      >
        <motion.div
          custom={0}
          variants={card}
          className="glass relative rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ice/90"
        >
          <span className="glass-sheen" />
          {brand}
        </motion.div>

        <motion.div
          custom={1}
          variants={card}
          className="glass relative w-full rounded-[2rem] px-6 py-10 text-center sm:px-10 sm:py-14 short:py-5 short:sm:py-5"
        >
          <span className="glass-sheen" />
          <h1 className="text-balance bg-[linear-gradient(120deg,#ffffff_10%,#ddf5ff_40%,#3cfffc_75%)] bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl short:text-4xl short:sm:text-5xl">
            {headline}
          </h1>
        </motion.div>

        <motion.div
          custom={2}
          variants={card}
          className="glass relative max-w-md rounded-2xl px-5 py-3 text-center text-sm text-ice/80 sm:text-base"
        >
          <span className="glass-sheen" />
          {tagline}
        </motion.div>

        <motion.div custom={3} variants={card} className="mt-4 short:mt-1">
          <Button
            size="lg"
            onClick={onStart}
            className="group bg-aqua text-ink shadow-[0_0_40px_-6px_#3cfffc] hover:bg-ice"
          >
            <Sparkles aria-hidden />
            Take your spin
            <ArrowRight aria-hidden className="transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
