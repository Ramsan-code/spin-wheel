"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { PublicPrize } from "@/lib/prizes";
import { EASE_OUT_EXPO } from "./easing";
import { GiftBody, GiftLid } from "./gift-art";
import { PRIZE_ICONS } from "./icons";
import type { WheelSound } from "./use-wheel-sound";

const OPEN_AT_MS = 1500;
const DONE_AT_MS = 3300;

type Props = {
  prize: PublicPrize;
  sound: WheelSound;
  onDone: () => void;
};

/**
 * Reward stage (after the SVGator "reward gift box" template): the gift from
 * the wheel bounces, the lid pops off, light bursts out and the prize rises.
 * Only shown right after a live spin, never server-rendered.
 */
export function GiftBoxScene({ prize, sound, onDone }: Props) {
  const reduce = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const chimed = useRef(false);
  const { chime } = sound;
  const Icon = PRIZE_ICONS[prize.icon];
  const colors = { box: "#ddf5ff", ribbon: "#ff6ad5" };

  useEffect(() => {
    const open = window.setTimeout(() => {
      setOpened(true);
      if (!chimed.current) {
        chimed.current = true;
        chime(prize.win);
      }
    }, reduce ? 0 : OPEN_AT_MS);
    const done = window.setTimeout(onDone, reduce ? 700 : DONE_AT_MS);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(done);
    };
  }, [reduce, chime, prize.win, onDone]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-12">
      <p className="glass relative rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-ice/85">
        <span className="glass-sheen" />
        {opened ? (prize.win ? "Your reward" : "Inside the box") : "Opening your gift"}
      </p>

      <div className="relative grid size-72 place-items-center sm:size-80">
        {/* light rays + glow, once open */}
        <motion.div
          aria-hidden
          className="absolute inset-[-30%] rounded-full bg-[repeating-conic-gradient(from_0deg,#3cfffc33_0deg_8deg,transparent_8deg_24deg)] [mask-image:radial-gradient(closest-side,black,transparent)] animate-[rays-spin_18s_linear_infinite]"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={opened ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        />
        <motion.div
          aria-hidden
          className="absolute size-2/3 rounded-full bg-[radial-gradient(closest-side,#ffffffcc,#3cfffc66_45%,transparent)] blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: opened ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* prize rising out of the box */}
        <motion.div
          className="absolute z-0 grid size-28 place-items-center rounded-full border border-white/50 shadow-[inset_0_2px_0_#ffffffaa,0_20px_50px_-15px_#000]"
          style={{ background: `linear-gradient(145deg, ${prize.from}, ${prize.to})` }}
          initial={{ y: 40, scale: 0.3, opacity: 0 }}
          animate={opened ? { y: -70, scale: 1, opacity: 1 } : { y: 40, scale: 0.3, opacity: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 170, damping: 13 }}
        >
          {prize.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- small decorative prize image
            <img src={prize.image} alt="" className="size-20 object-contain" />
          ) : (
            <Icon aria-hidden className="size-12 text-white drop-shadow" strokeWidth={1.75} />
          )}
        </motion.div>

        {/* the gift: anticipation bounces, then the lid pops */}
        <motion.div
          className="relative z-10 size-48 sm:size-56"
          animate={
            opened
              ? { y: 40, scale: 0.9 }
              : { y: [0, -26, 0, -16, 0, -8, 0], rotate: [0, -4, 3, -3, 2, -1, 0], scaleY: [1, 1.05, 0.92, 1.04, 0.95, 1.02, 1] }
          }
          transition={opened ? { duration: 0.5, ease: EASE_OUT_EXPO } : { duration: 1.3, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full overflow-visible drop-shadow-[0_24px_30px_rgba(0,0,0,0.55)]" aria-hidden>
            <GiftBody {...colors} />
          </svg>
          <motion.svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
            initial={false}
            animate={opened ? { y: -150, x: 40, rotate: 28, opacity: 0 } : { y: 0, x: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO, opacity: { delay: 0.35, duration: 0.35 } }}
          >
            <GiftLid {...colors} />
          </motion.svg>
        </motion.div>
      </div>

      <motion.p
        className="h-8 text-center text-xl font-semibold text-white sm:text-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={opened ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {prize.name}
      </motion.p>

      <p aria-live="polite" className="sr-only">
        {opened ? (prize.win ? `You won: ${prize.name}` : "No prize this time.") : ""}
      </p>
    </div>
  );
}
