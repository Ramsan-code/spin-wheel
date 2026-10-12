"use client";

import { motion } from "motion/react";

import { EASE_IN_OUT } from "./easing";

/**
 * Stage spotlights behind the gift-box stage (after the SVGator "logo reveal –
 * stage spotlights" template), kept calm for a financial brand:
 * two cool beams sweep once from the top corners, cross, and settle on the
 * gift, then drift very slightly. Only transforms/opacity animate, so it stays
 * smooth on phones. With reduced motion the beams simply appear in place.
 */
export function Spotlights() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <Beam side="left" />
      <Beam side="right" />
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

function Beam({ side }: { side: "left" | "right" }) {
  const s = side === "left" ? 1 : -1;

  // Sweep in from outside, cross past the centre, settle on the card.
  return (
    <motion.div
      className="absolute top-[-8%] h-[135vh] w-[70vmin] -translate-x-1/2 origin-top"
      style={{ left: side === "left" ? "22%" : "78%", willChange: "transform" }}
      initial={{ rotate: s * 50, opacity: 0 }}
      animate={{ rotate: [s * 50, s * -40, s * -28], opacity: [0, 1, 1] }}
      transition={{ duration: 1.7, ease: EASE_IN_OUT, times: [0, 0.6, 1] }}
    >
      {/* inner layer: barely-there drift after the sweep */}
      {/* blur sits on the parent: CSS applies filter before clip-path, so blurring
          the clipped element itself would leave hard edges */}
      <motion.div
        className="size-full origin-top blur-[18px]"
        animate={{ rotate: [0, s * 2.5, 0] }}
        transition={{ delay: 1.8, duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="size-full bg-[linear-gradient(to_bottom,#ddf5ff59,#ddf5ff1f_35%,#3cfffc0d_65%,transparent)] [clip-path:polygon(47%_0,53%_0,100%_100%,0_100%)]" />
      </motion.div>
    </motion.div>
  );
}
