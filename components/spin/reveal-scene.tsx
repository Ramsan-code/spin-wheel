"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowRight, PartyPopper, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PublicPrize } from "@/lib/prizes";
import { EASE_IN_OUT, EASE_OUT_EXPO } from "./easing";
import { PRIZE_ICONS } from "./icons";

type Props = {
  prize: PublicPrize;
  /** true when the visitor lands here from a previous session. */
  returning: boolean;
  showDevReset: boolean;
  onReset: () => void;
  resetting: boolean;
};

// Final result: split-view product card (after the SVGator "split view
// product showcase") whose visual side is uncovered by a sliding panel
// (after "product showcase – image reveal effect").
export function RevealScene({ prize, returning, showDevReset, onReset, resetting }: Props) {
  const reduce = useReducedMotion();
  const Icon = PRIZE_ICONS[prize.icon];

  const text: Variants = {
    hidden: { opacity: 0, y: 18 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.7 + i * 0.1, duration: 0.6, ease: EASE_OUT_EXPO },
    }),
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-12">
      {/* Only after a live spin (never server-rendered), so reading reduce is safe. */}
      {prize.win && !returning && !reduce && <Burst colors={[prize.from, prize.to, "#ddf5ff"]} />}

      <motion.article
        initial={{ opacity: 0, scale: 0.92, rotateX: 18, y: 30 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className="glass relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] [perspective:1200px] md:grid-cols-2"
        aria-labelledby="prize-title"
      >
        <span className="glass-sheen" />

        {/* Visual half */}
        <div
          className="relative grid min-h-64 place-items-center overflow-hidden md:min-h-[26rem]"
          style={{ background: `linear-gradient(150deg, ${prize.from}, ${prize.to})` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#ffffff66,transparent_55%)]" />
          <div className="absolute -bottom-10 -right-10 size-48 rounded-full border-[18px] border-white/25" />
          <div className="absolute left-8 top-8 size-10 rotate-12 rounded-xl border border-white/40 bg-white/20" />

          <motion.div
            initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.55, type: "spring", stiffness: 160, damping: 14 }}
            className="relative grid size-36 place-items-center rounded-full border border-white/50 bg-white/20 shadow-[inset_0_2px_0_#ffffffaa,0_30px_60px_-20px_#0008] backdrop-blur-md sm:size-44"
          >
            <Icon aria-hidden className="size-16 text-white drop-shadow-lg sm:size-20" strokeWidth={1.75} />
          </motion.div>

          {/* The wipe panel: covers the visual, then slides away. */}
          {/* scaleX is a transform, so reduced-motion users see it removed instantly */}
          <motion.div
            aria-hidden
            className="absolute inset-0 origin-right bg-[linear-gradient(120deg,#ff6ad5,#8b7bff_55%,#3cfffc)]"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ delay: 0.35, duration: 0.9, ease: EASE_IN_OUT }}
          />
        </div>

        {/* Text half */}
        <div className="relative flex flex-col justify-center gap-4 p-7 sm:p-10">
          <motion.p
            custom={0}
            variants={text}
            initial="hidden"
            animate="show"
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-aqua"
          >
            {prize.win && <PartyPopper aria-hidden className="size-4" />}
            {prize.win ? (returning ? "Your prize" : "You won") : "So close"}
          </motion.p>

          <motion.h2
            id="prize-title"
            custom={1}
            variants={text}
            initial="hidden"
            animate="show"
            className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl"
          >
            {prize.name}
          </motion.h2>

          <motion.p
            custom={2}
            variants={text}
            initial="hidden"
            animate="show"
            className="text-pretty text-ice/75"
          >
            {prize.description}
          </motion.p>

          <motion.div
            custom={3}
            variants={text}
            initial="hidden"
            animate="show"
            className="mt-2 flex flex-wrap items-center gap-3"
          >
            {prize.win ? (
              <Button asChild size="lg" className="bg-aqua text-ink shadow-[0_0_40px_-8px_#3cfffc] hover:bg-ice">
                {/* TODO: point to your real claim flow */}
                <a href="#claim">
                  Claim prize <ArrowRight aria-hidden />
                </a>
              </Button>
            ) : (
              <Button asChild size="lg" variant="glass">
                <a href="#newsletter">Get notified about the next spin</a>
              </Button>
            )}
          </motion.div>

          <motion.p
            custom={4}
            variants={text}
            initial="hidden"
            animate="show"
            className="text-xs text-ice/45"
          >
            One spin per member. Prizes are non-transferable and have no cash value. Terms apply.
          </motion.p>

          {showDevReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={resetting}
              className="self-start text-ice/60"
            >
              <RefreshCw aria-hidden className={resetting ? "animate-spin" : undefined} />
              Reset spin (dev only)
            </Button>
          )}
        </div>
      </motion.article>
    </div>
  );
}

/** A small, one-shot burst of glass chips. 20 elements, transforms only. */
function Burst({ colors }: { colors: string[] }) {
  const chips = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2;
    const dist = 180 + (i % 5) * 45;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.75,
      rotate: (i % 2 ? 1 : -1) * (90 + i * 17),
      color: colors[i % colors.length],
      size: 8 + (i % 4) * 4,
    };
  });

  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 z-20">
      {chips.map((c, i) => (
        <motion.span
          key={i}
          className="absolute rounded-[3px] border border-white/50"
          style={{ width: c.size, height: c.size, background: c.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 1, 0], scale: 1, rotate: c.rotate }}
          transition={{ delay: 0.5, duration: 1.6, ease: EASE_OUT_EXPO, opacity: { delay: 0.5, duration: 1.6, times: [0, 0.1, 0.7, 1] } }}
        />
      ))}
    </div>
  );
}
