"use client";

import { useCallback, useState, useTransition } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { resetSpin } from "@/app/actions";
import type { PublicPrize } from "@/lib/prizes";
import { EASE_OUT_EXPO } from "./easing";
import { GiftBoxScene } from "./gift-box-scene";
import { IntroScene } from "./intro-scene";
import { PrizeWheel, type WheelFaces } from "./prize-wheel";
import { RevealScene } from "./reveal-scene";
import { ShuffleScene } from "./shuffle-scene";
import { useWheelSound } from "./use-wheel-sound";

/**
 * Stage order:
 *   1. intro   – welcome title card         (SVGator: liquid glass marketing intro)
 *   2. wheel   – round wheel of gifts        (custom SVG + Motion)
 *   (optional) shuffle – single card slider (SVGator: liquid glass single card slider)
 *   3. gift    – gift box bounces open       (SVGator: reward gift box)
 *   4. reveal  – final prize showcase        (SVGator: product showcase image reveal)
 */
type Scene = "intro" | "wheel" | "shuffle" | "gift" | "reveal";

/** "gifts" = a gift box on every segment; "prizes" = prize image/icon + name. */
const WHEEL_FACES: WheelFaces = "gifts";
/** Turn on to add the card-slider shuffle between the wheel and the gift box. */
const SHOW_SHUFFLE = false;

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
  // Returning visitors skip straight to the final reveal.
  const [scene, setScene] = useState<Scene>(previousIndex === null ? "intro" : "reveal");
  const [winIndex, setWinIndex] = useState<number | null>(previousIndex);
  const [returning, setReturning] = useState(previousIndex !== null);
  const [resetting, startReset] = useTransition();
  const [soundOn, setSoundOn] = useState(true);
  // Shared by all stages, so audio unlocked by the Spin click keeps working.
  const sound = useWheelSound(soundOn);

  const exit = { opacity: 0, scale: 0.96, filter: "blur(8px)", transition: { duration: 0.35 } };
  const enter = {
    initial: { opacity: 0, scale: 1.03 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
  };

  const handleLanded = useCallback((index: number) => {
    setWinIndex(index);
    setScene(SHOW_SHUFFLE ? "shuffle" : "gift");
  }, []);
  const handleShuffleDone = useCallback(() => setScene("gift"), []);
  const handleGiftDone = useCallback(() => setScene("reveal"), []);

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
            <PrizeWheel
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
          <motion.section key="shuffle" {...enter} exit={exit} aria-label="Shuffling prizes">
            <ShuffleScene prizes={prizes} winIndex={winIndex} sound={sound} onDone={handleShuffleDone} />
          </motion.section>
        )}

        {scene === "gift" && winIndex !== null && (
          <motion.section key="gift" {...enter} exit={exit} aria-label="Opening your gift">
            <GiftBoxScene prize={prizes[winIndex]} sound={sound} onDone={handleGiftDone} />
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
