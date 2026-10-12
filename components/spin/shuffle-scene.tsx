"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";

import type { PublicPrize } from "@/lib/prizes";
import { EASE_OUT_EXPO } from "./easing";
import { PRIZE_ICONS } from "./icons";
import type { WheelSound } from "./use-wheel-sound";

const STEPS = 18;
const HOLD_MS = 1200;

type Props = {
  prizes: PublicPrize[];
  winIndex: number;
  sound: WheelSound;
  onDone: () => void;
};

/**
 * Stage 3, the "confuse" step (after the SVGator "liquid glass single card
 * slider"): one wide glass card slides quickly through the products, slows
 * down, and stops on the prize the server picked.
 * Only shown right after a live spin, never server-rendered.
 */
export function ShuffleScene({ prizes, winIndex, sound, onDone }: Props) {
  const reduce = useReducedMotion();
  const n = prizes.length;
  const steps = reduce ? 1 : STEPS;

  // Walk through the prizes so the last step lands on the winner.
  const sequence = useMemo(
    () => Array.from({ length: steps }, (_, k) => (((winIndex - (steps - 1 - k)) % n) + n) % n),
    [steps, winIndex, n],
  );
  // Delay before each step: fast at first, then easing out (ms).
  const delays = useMemo(
    () => sequence.map((_, k) => 70 + 430 * Math.pow(k / Math.max(1, steps - 1), 2.6)),
    [sequence, steps],
  );

  const [step, setStep] = useState(0);
  const done = step === steps - 1;
  const { tick, chime } = sound;
  const chimed = useRef(false);

  useEffect(() => {
    if (done) {
      if (!chimed.current) {
        chimed.current = true;
        chime(prizes[winIndex].win);
      }
      const t = window.setTimeout(onDone, reduce ? 400 : HOLD_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      tick();
      setStep((s) => s + 1);
    }, delays[step + 1]);
    return () => window.clearTimeout(t);
  }, [step, done, delays, tick, chime, onDone, prizes, winIndex, reduce]);

  const prize = prizes[sequence[step]];
  const Icon = PRIZE_ICONS[prize.icon];
  const speed = Math.min(0.35, Math.max(0.1, (delays[step + 1] ?? 400) / 1000));

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-4 py-12">
      <p className="glass relative rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-ice/85">
        <span className="glass-sheen" />
        {done ? "Your prize is…" : "Shuffling prizes"}
      </p>

      <div className="relative w-full max-w-2xl [perspective:1200px]">
        <motion.div
          className="glass relative h-44 overflow-hidden rounded-[2rem] sm:h-52"
          animate={done ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          style={{
            boxShadow: done ? `0 0 0 1px ${prize.from}, 0 0 80px -10px ${prize.from}` : undefined,
          }}
        >
          <span className="glass-sheen" />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={step}
              className="absolute inset-0 flex items-center gap-5 px-6 sm:gap-8 sm:px-10"
              initial={{ x: "60%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-60%", opacity: 0 }}
              transition={{ duration: speed, ease: EASE_OUT_EXPO }}
            >
              <div
                className="grid size-24 shrink-0 place-items-center rounded-full border border-white/40 shadow-[inset_0_1px_0_#ffffffaa,0_16px_40px_-14px_#000] sm:size-32"
                style={{ background: `linear-gradient(145deg, ${prize.from}, ${prize.to})` }}
              >
                <Icon aria-hidden className="size-10 text-white drop-shadow sm:size-14" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-2xl font-semibold tracking-tight text-white sm:text-4xl">
                  {prize.name}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-ice/65">{prize.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* progress dots */}
        <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
          {prizes.map((p, i) => (
            <span
              key={p.id}
              className="h-1.5 rounded-full bg-white/25 transition-all duration-200"
              style={{
                width: i === sequence[step] ? 22 : 6,
                background: i === sequence[step] ? prize.from : undefined,
              }}
            />
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {done ? (prize.win ? `You won: ${prize.name}` : "No prize this time.") : ""}
      </p>
      {done && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm text-aqua"
          aria-hidden
        >
          <Sparkles className="size-4" /> Opening your prize
        </motion.p>
      )}
    </div>
  );
}
