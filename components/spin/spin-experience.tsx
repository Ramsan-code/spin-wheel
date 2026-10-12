"use client";

import { useCallback, useState, useTransition } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { resetSpin } from "@/app/actions";
import type { PublicPrize } from "@/lib/prizes";
import { CardWheel, type WheelFaces } from "./card-wheel";
import { EASE_OUT_EXPO } from "./easing";
import { IntroScene } from "./intro-scene";
import { RevealScene } from "./reveal-scene";
import { ShuffleScene } from "./shuffle-scene";
import { useWheelSound } from "./use-wheel-sound";

/**
 * The four stages, in order:
 *   1. intro   – welcome title card      (SVGator: liquid glass marketing intro)
 *   2. wheel   – spin the card wheel     (SVGator: rotating fan of promo cards)
 *   3. shuffle – "confuse" before the win (SVGator: liquid glass single card slider)
 *   4. reveal  – final prize showcase    (SVGator: split view + image reveal)
 */
type Scene = "intro" | "wheel" | "shuffle" | "reveal";

/** "mystery" keeps the prize secret until the shuffle; "prizes" shows them on the wheel. */
const WHEEL_FACES: WheelFaces = "mystery";

type Props = {
  prizes: PublicPrize[];
  campaign: { brand: string; headline: string; tagline: string };
  /** Set by the server when this visitor has already spun. */
  previousIndex: number | null;
  showDevReset: boolean;
};

/**
 * Client boundary for the whole flow. Everything above this (page, data,
 * prize odds) stays on the server.
 */
export function SpinExperience({ prizes, campaign, previousIndex, showDevReset }: Props) {
  // Returning visitors skip straight to stage 4.
  const [scene, setScene] = useState<Scene>(previousIndex === null ? "intro" : "reveal");
  const [winIndex, setWinIndex] = useState<number | null>(previousIndex);
  const [returning, setReturning] = useState(previousIndex !== null);
  const [resetting, startReset] = useTransition();
  const [soundOn, setSoundOn] = useState(true);
  // Shared by stages 2 and 3, so the audio unlocked by the Spin click keeps working.
  const sound = useWheelSound(soundOn);

  const exit = { opacity: 0, scale: 0.96, filter: "blur(8px)", transition: { duration: 0.35 } };

  const enter = {
    initial: { opacity: 0, scale: 1.03 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
  };

  const handleLanded = useCallback((index: number) => {
    setWinIndex(index);
    setScene("shuffle");
  }, []);

  const handleShuffleDone = useCallback(() => setScene("reveal"), []);

  const handleReset = () =>
    startReset(async () => {
      await resetSpin();
      setWinIndex(null);
      setReturning(false);
      setScene("intro");
    });

  return (
    // reducedMotion="user": Motion skips transform animations for visitors who
    // ask for reduced motion, identically on server and client (no hydration diff).
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {scene === "intro" && (
          <motion.section key="intro" {...enter} exit={exit} aria-label="Welcome">
            <IntroScene {...campaign} onStart={() => setScene("wheel")} />
          </motion.section>
        )}

        {scene === "wheel" && (
          <motion.section
            key="wheel"
            {...enter}
            exit={exit}
            aria-label="Spin the wheel"
            className="flex min-h-dvh items-center"
          >
            <CardWheel
              prizes={prizes}
              faces={WHEEL_FACES}
              sound={sound}
              soundOn={soundOn}
              onToggleSound={() => setSoundOn((s) => !s)}
              onLanded={handleLanded}
            />
          </motion.section>
        )}

        {scene === "shuffle" && winIndex !== null && (
          <motion.section key="shuffle" {...enter} exit={exit} aria-label="Revealing your prize">
            <ShuffleScene
              prizes={prizes}
              winIndex={winIndex}
              sound={sound}
              onDone={handleShuffleDone}
            />
          </motion.section>
        )}

        {scene === "reveal" && winIndex !== null && (
          <motion.section key="reveal" {...enter} exit={exit} aria-label="Your result">
            <RevealScene
              prize={prizes[winIndex]}
              returning={returning}
              showDevReset={showDevReset}
              onReset={handleReset}
              resetting={resetting}
            />
          </motion.section>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
