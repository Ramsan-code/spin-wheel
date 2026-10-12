"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";

import { resetSpin } from "@/app/actions";
import type { PublicPrize } from "@/lib/prizes";
import { CardWheel } from "./card-wheel";
import { EASE_OUT_EXPO } from "./easing";
import { IntroScene } from "./intro-scene";
import { RevealScene } from "./reveal-scene";

type Scene = "intro" | "wheel" | "reveal";

type Props = {
  prizes: PublicPrize[];
  campaign: { brand: string; headline: string; tagline: string };
  /** Set by the server when this visitor has already spun. */
  previousIndex: number | null;
  showDevReset: boolean;
};

/**
 * Client boundary for the whole flow: intro → wheel → reveal.
 * Everything above this (page, data, prize odds) stays on the server.
 */
export function SpinExperience({ prizes, campaign, previousIndex, showDevReset }: Props) {
  const [scene, setScene] = useState<Scene>(previousIndex === null ? "intro" : "reveal");
  const [winIndex, setWinIndex] = useState<number | null>(previousIndex);
  const [returning, setReturning] = useState(previousIndex !== null);
  const [resetting, startReset] = useTransition();

  const exit = { opacity: 0, scale: 0.96, filter: "blur(8px)", transition: { duration: 0.35 } };

  const enter = {
    initial: { opacity: 0, scale: 1.03 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
  };

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
            onLanded={(index) => {
              setWinIndex(index);
              setScene("reveal");
            }}
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
