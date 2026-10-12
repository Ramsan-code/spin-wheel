"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import type { PublicPrize } from "@/lib/prizes";
import { EASE_OUT_EXPO } from "./easing";
import { GiftBody, GiftLid } from "./gift-art";
import { PRIZE_ICONS } from "./icons";
import type { WheelSound } from "./use-wheel-sound";

const OPEN_AT_MS = 1400;
const DONE_AT_MS = 3400;

type Props = {
  prize: PublicPrize;
  sound: WheelSound;
  onDone: () => void;
};

/**
 * Reward stage (after the SVGator "reward gift box" template), styled for a
 * financial brand: a calm float, the lid lifts, a soft beam of light, and the
 * prize rises in a glass medallion. No bounce, no confetti.
 * Only shown right after a live spin, never server-rendered.
 */
export function GiftBoxScene({ prize, sound, onDone }: Props) {
  const reduce = useReducedMotion();
  const [opened, setOpened] = useState(false);
  const chimed = useRef(false);
  const { chime } = sound;
  const Icon = PRIZE_ICONS[prize.icon];

  useEffect(() => {
    const open = window.setTimeout(
      () => {
        setOpened(true);
        if (!chimed.current) {
          chimed.current = true;
          chime(prize.win);
        }
      },
      reduce ? 0 : OPEN_AT_MS,
    );
    const done = window.setTimeout(onDone, reduce ? 700 : DONE_AT_MS);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(done);
    };
  }, [reduce, chime, prize.win, onDone]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-10 px-4 py-12">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-ice/60">
        {opened ? (prize.win ? "Your reward" : "Result") : "Unlocking your reward"}
      </p>

      <div className="relative grid size-72 place-items-center sm:size-80">
        {/* soft beam + halo once open */}
        <motion.div
          aria-hidden
          className="absolute bottom-[38%] h-[70%] w-[46%] origin-bottom bg-[linear-gradient(to_top,#3cfffc40,transparent)] blur-md [clip-path:polygon(30%_100%,70%_100%,100%_0,0_0)]"
          initial={{ opacity: 0, scaleY: 0.2 }}
          animate={opened ? { opacity: 1, scaleY: 1 } : { opacity: 0, scaleY: 0.2 }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        />
        <motion.div
          aria-hidden
          className="absolute top-[8%] size-1/2 rounded-full bg-[radial-gradient(closest-side,#3cfffc33,transparent)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: opened ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        />

        {/* prize medallion rising out of the box */}
        <motion.div
          className="absolute z-0 grid size-24 place-items-center rounded-full border border-white/30 shadow-[inset_0_1px_0_#ffffff66,0_20px_50px_-15px_#000] sm:size-28"
          style={{ background: `linear-gradient(145deg, ${prize.from}, ${prize.to})` }}
          initial={{ y: 40, scale: 0.6, opacity: 0 }}
          animate={opened ? { y: -80, scale: 1, opacity: 1 } : { y: 40, scale: 0.6, opacity: 0 }}
          transition={{ delay: 0.2, duration: 0.9, ease: EASE_OUT_EXPO }}
        >
          {prize.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- small decorative prize image
            <img src={prize.image} alt="" className="size-16 object-contain sm:size-20" />
          ) : (
            <Icon aria-hidden className="size-10 text-ice sm:size-12" strokeWidth={1.5} />
          )}
        </motion.div>

        {/* the box: enters, floats once, then settles as the lid lifts */}
        <motion.div
          className="relative z-10 size-44 sm:size-52"
          initial={{ y: 24, opacity: 0 }}
          animate={opened ? { y: 36, opacity: 1 } : { y: [24, 0, -6, 0], opacity: 1 }}
          transition={opened ? { duration: 0.7, ease: EASE_OUT_EXPO } : { duration: 1.3, ease: "easeInOut" }}
        >
          {/* edge glow pulse just before opening */}
          <motion.div
            aria-hidden
            className="absolute inset-[12%] rounded-md shadow-[0_0_40px_-6px_#3cfffc]"
            initial={{ opacity: 0 }}
            animate={{ opacity: opened ? 0.25 : [0, 0, 0.8] }}
            transition={{ duration: opened ? 0.6 : 1.3 }}
          />
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full overflow-visible drop-shadow-[0_24px_30px_rgba(0,0,0,0.6)]"
            aria-hidden
          >
            <GiftBody />
          </svg>
          <motion.svg
            viewBox="0 0 100 100"
            className="absolute inset-0 size-full overflow-visible"
            aria-hidden
            initial={false}
            animate={opened ? { y: -70, rotate: -8, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: EASE_OUT_EXPO, opacity: { delay: 0.3, duration: 0.5 } }}
          >
            <GiftLid />
          </motion.svg>
        </motion.div>
      </div>

      <motion.p
        className="h-8 text-center text-xl font-semibold tracking-tight text-white sm:text-2xl"
        initial={{ opacity: 0, y: 8 }}
        animate={opened ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: 0.5, duration: 0.6, ease: EASE_OUT_EXPO }}
      >
        {prize.name}
      </motion.p>

      <p aria-live="polite" className="sr-only">
        {opened ? (prize.win ? `You won: ${prize.name}` : "No prize this time.") : ""}
      </p>
    </div>
  );
}
