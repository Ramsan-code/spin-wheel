"use client";

import { motion } from "motion/react";

import { EASE_IN_OUT } from "./easing";

/**
 * Stage spotlights behind the gift-box stage (after the SVGator "logo reveal –
 * stage spotlights" template), kept calm for a financial brand:
 * three cool beams. The two side beams sweep in from the top corners and cross,
 * then a centre beam drops straight down; all three settle on the gift and
 * drift very slightly. Only transforms/opacity animate, so it stays
 * smooth on phones. With reduced motion the beams simply appear in place.
 */
export function Spotlights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Beam side="left" />
      <Beam side="right" />
      <Beam side="center" />
    </div>
  );
}

/**
 * Floor under the card: a pool of light, a thin highlight where the light meets
 * the floor, and a soft contact shadow so the card sits on it. Render inside a
 * relative wrapper around the card so it follows the card's size on any screen.
 */
export function SpotlightFloor() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 1.2 }}
    >
      {/* pool of light */}
      <div className="absolute left-1/2 top-[-28px] h-36 w-[118%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#ddf5ff6b,#3cfffc29_45%,transparent)] blur-2xl" />
      {/* contact shadow right under the card edge */}
      <div className="absolute left-1/2 top-[-10px] h-6 w-[86%] -translate-x-1/2 rounded-[50%] bg-black/55 blur-lg" />
      {/* thin floor highlight */}
      <div className="absolute left-1/2 top-[26px] h-px w-[78%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,#ddf5ff59,transparent)]" />
    </motion.div>
  );
}

type Side = "left" | "center" | "right";

// Where each beam hangs, how it sweeps in (start → overshoot → rest, in degrees)
// and when it starts. Three beams add up, so each is a little softer than two.
const BEAMS: Record<Side, { left: string; width: string; sweep: [number, number, number]; delay: number; drift: number }> = {
  left: { left: "20%", width: "70vmin", sweep: [50, -40, -30], delay: 0, drift: 2.5 },
  right: { left: "80%", width: "70vmin", sweep: [-50, 40, 30], delay: 0, drift: -2.5 },
  center: { left: "50%", width: "58vmin", sweep: [-24, 8, 0], delay: 0.35, drift: 1.5 },
};

function Beam({ side }: { side: Side }) {
  const b = BEAMS[side];

  return (
    <motion.div
      className="absolute top-[-8%] h-[135vh] -translate-x-1/2 origin-top"
      style={{ left: b.left, width: b.width, willChange: "transform" }}
      initial={{ rotate: b.sweep[0], opacity: 0 }}
      animate={{ rotate: b.sweep, opacity: [0, 1, 1] }}
      transition={{ delay: b.delay, duration: 1.7, ease: EASE_IN_OUT, times: [0, 0.6, 1] }}
    >
      {/* inner layer: barely-there drift after the sweep */}
      {/* blur sits on the parent: CSS applies filter before clip-path, so blurring
          the clipped element itself would leave hard edges */}
      <motion.div
        className="size-full origin-top blur-[18px]"
        animate={{ rotate: [0, b.drift, 0] }}
        transition={{ delay: 1.8 + b.delay, duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="size-full bg-[linear-gradient(to_bottom,#ddf5ff4d,#ddf5ff1a_35%,#3cfffc0b_65%,transparent)] [clip-path:polygon(47%_0,53%_0,100%_100%,0_100%)]" />
      </motion.div>
    </motion.div>
  );
}
