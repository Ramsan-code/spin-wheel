"use client";

import { useCallback, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { Loader2, Volume2, VolumeX } from "lucide-react";

import { spinWheel, type SpinResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { PublicPrize } from "@/lib/prizes";
import { cn } from "@/lib/utils";
import { EASE_SPIN } from "./easing";
import { Gift } from "./gift-art";
import { PRIZE_ICONS } from "./icons";
import type { WheelSound } from "./use-wheel-sound";

/**
 * "gifts":  every segment shows a gift box, so the prize stays a surprise
 *           until the gift-box stage.
 * "prizes": segments show the prize image (prize.image) or its icon + name.
 */
export type WheelFaces = "gifts" | "prizes";

type Phase = "idle" | "spinning" | "landed";

const TURNS = 6;
const R = 170; // segment radius in SVG units (viewBox -R..R)
const LIGHTS = 16;

// Segment colours (alternating) and the gift colours drawn on each.
const SEGMENTS = [
  { fill: "#0e7c8c", box: "#ddf5ff", ribbon: "#ff6ad5" },
  { fill: "#3b2f8f", box: "#3cfffc", ribbon: "#ffffff" },
  { fill: "#8a2a6f", box: "#ffd36b", ribbon: "#3b2f8f" },
  { fill: "#16306b", box: "#ff6ad5", ribbon: "#ddf5ff" },
];

const mod = (n: number, m: number) => ((n % m) + m) % m;

const finished = (controls: { then: (resolve: () => void) => unknown }) =>
  new Promise<void>((resolve) => {
    controls.then(resolve);
  });

/** Point on a circle, angle in degrees clockwise from 12 o'clock. */
function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: r * Math.sin(a), y: -r * Math.cos(a) };
}

/** Pointer angle (deg, clockwise from top) relative to an element's centre. */
function angleAround(rect: DOMRect, x: number, y: number) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return (Math.atan2(x - cx, -(y - cy)) * 180) / Math.PI;
}

type Props = {
  prizes: PublicPrize[];
  faces: WheelFaces;
  sound: WheelSound;
  soundOn: boolean;
  onToggleSound: () => void;
  onLanded: (index: number) => void;
};

export function PrizeWheel({ prizes, faces, sound, soundOn, onToggleSound, onLanded }: Props) {
  const reduce = useReducedMotion();
  const rotate = useMotionValue(0);
  const pointerTilt = useMotionValue(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const { unlock, tick } = sound;

  const n = prizes.length;
  const seg = 360 / n;
  const busy = useRef(false);
  const lastIdx = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const drag = useRef<{ rect: DOMRect; last: number } | null>(null);

  // Tick + flick the pointer each time a new segment passes under it.
  useMotionValueEvent(rotate, "change", (v) => {
    const idx = mod(Math.round(-v / seg), n);
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    if (!busy.current && !drag.current) return;
    tick();
    if (!reduce) {
      pointerTilt.set(-dirRef.current * 22);
      animate(pointerTilt, 0, { type: "spring", stiffness: 520, damping: 14 });
    }
  });

  const spin = useCallback(
    async (dir: 1 | -1 = 1) => {
      if (busy.current || phase !== "idle") return;
      busy.current = true;
      dirRef.current = dir;
      unlock();
      setPhase("spinning");
      setMessage("Spinning…");

      const start = rotate.get();
      const windUp = reduce
        ? Promise.resolve()
        : finished(animate(rotate, start - dir * 10, { duration: 0.35, ease: "easeOut" }));

      let result: SpinResult;
      try {
        [result] = await Promise.all([spinWheel(), windUp]);
      } catch {
        busy.current = false;
        setPhase("idle");
        setMessage("Something went wrong. Please try again.");
        animate(rotate, start, { type: "spring", stiffness: 200, damping: 20 });
        return;
      }

      const index = result.index;
      const current = rotate.get();
      const desired = -index * seg;
      const delta = dir > 0 ? mod(desired - current, 360) : -mod(current - desired, 360);
      // Land somewhere inside the segment, not always dead centre (cosmetic only).
      const jitter = (Math.random() - 0.5) * seg * 0.5;
      const target = current + dir * 360 * TURNS + delta + jitter;

      if (reduce) {
        rotate.set(target);
      } else {
        await finished(animate(rotate, target, { duration: 5.6, ease: EASE_SPIN }));
      }

      setPhase("landed");
      setMessage(result.ok ? "The wheel has stopped. Opening your gift." : "You already spun. Opening your result.");
      window.setTimeout(() => onLanded(index), reduce ? 300 : 900);
    },
    [phase, unlock, rotate, reduce, seg, onLanded],
  );

  // Circular drag: the wheel follows the finger around its centre.
  const onPanStart = (e: PointerEvent) => {
    const rect = wheelRef.current?.getBoundingClientRect();
    if (busy.current || !rect) return;
    unlock();
    drag.current = { rect, last: angleAround(rect, e.clientX, e.clientY) };
  };
  const onPan = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const a = angleAround(d.rect, e.clientX, e.clientY);
    let step = a - d.last;
    if (step > 180) step -= 360;
    if (step < -180) step += 360;
    d.last = a;
    rotate.set(rotate.get() + step);
  };
  const onPanEnd = (e: PointerEvent, info: PanInfo) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    // Tangential speed of the release: positive = clockwise.
    const rx = e.clientX - (d.rect.left + d.rect.width / 2);
    const ry = e.clientY - (d.rect.top + d.rect.height / 2);
    const len = Math.hypot(rx, ry) || 1;
    const tangential = (rx * info.velocity.y - ry * info.velocity.x) / len;
    if (Math.abs(tangential) > 400) {
      void spin(tangential > 0 ? 1 : -1);
    } else {
      animate(rotate, Math.round(rotate.get() / seg) * seg, { type: "spring", stiffness: 300, damping: 26 });
    }
  };

  const wheelRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full max-w-sm items-center justify-between">
        <div className="glass relative rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ice/85">
          <span className="glass-sheen" />1 free spin
        </div>
        <Button
          variant="glass"
          size="icon"
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sound" : "Turn sound on"}
          onClick={onToggleSound}
        >
          {soundOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
        </Button>
      </div>

      {/* tilted stage = the 3D look; one static transform */}
      <div className="w-[min(88vw,440px)] [perspective:1100px]">
        <motion.div
          ref={wheelRef}
          role="group"
          aria-roledescription="prize wheel"
          aria-label={`Prize wheel with ${n} gifts`}
          className={cn(
            "relative aspect-square w-full select-none [touch-action:none] [transform:rotateX(10deg)]",
            phase === "idle" ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          )}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
        >
          {/* floor shadow */}
          <div className="absolute -bottom-[7%] left-[12%] h-[10%] w-[76%] rounded-[50%] bg-black/60 blur-xl" />

          {/* glass rim (static, so its backdrop blur costs nothing per frame) */}
          <div className="glass absolute inset-0 rounded-full">
            <span className="glass-sheen" />
          </div>

          {/* rim lights */}
          {Array.from({ length: LIGHTS }, (_, i) => {
            const p = polar(46.6, (i * 360) / LIGHTS);
            return (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "absolute size-[3.2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ice shadow-[0_0_10px_2px_#3cfffc]",
                  "animate-[twinkle_1.1s_ease-in-out_infinite]",
                  i % 2 && "[animation-delay:0.55s]",
                )}
                style={{ left: `${50 + p.x}%`, top: `${50 + p.y}%` }}
              />
            );
          })}

          {/* rotating segments */}
          <motion.div
            className="absolute inset-[7%] rounded-full shadow-[inset_0_0_0_3px_#ffffff40,0_0_40px_-10px_#3cfffc]"
            style={{ rotate, willChange: "transform" }}
          >
            <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} className="size-full overflow-visible" aria-hidden>
              {prizes.map((prize, i) => {
                const a = i * seg;
                const p0 = polar(R, a - seg / 2);
                const p1 = polar(R, a + seg / 2);
                const colors = SEGMENTS[i % SEGMENTS.length];
                const Icon = PRIZE_ICONS[prize.icon];
                // Gift art has ~8% padding, so it can be a little wider than the chord.
                const size = Math.min(96, 2 * R * 0.62 * Math.sin((seg * Math.PI) / 360) * 1.12);
                return (
                  <g key={prize.id}>
                    <path
                      d={`M0 0 L${p0.x} ${p0.y} A${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`}
                      fill={colors.fill}
                      stroke="#ffffff"
                      strokeOpacity={0.35}
                      strokeWidth={1.5}
                    />
                    <g transform={`rotate(${a}) translate(0 ${-R * 0.62})`}>
                      {faces === "gifts" ? (
                        <g transform={`translate(${-size / 2} ${-size / 2}) scale(${size / 100})`}>
                          <Gift box={colors.box} ribbon={colors.ribbon} />
                        </g>
                      ) : prize.image ? (
                        <image
                          href={prize.image}
                          x={-size / 2}
                          y={-size / 2 - 8}
                          width={size}
                          height={size}
                          preserveAspectRatio="xMidYMid meet"
                        />
                      ) : (
                        <Icon x={-16} y={-30} width={32} height={32} color="#ffffff" strokeWidth={1.8} />
                      )}
                      {faces === "prizes" && (
                        <text y={size / 2 + 4} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="600">
                          {prize.short}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          {/* static gloss over the segments: makes the wheel read as glass */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[7%] rounded-full bg-[radial-gradient(120%_70%_at_30%_10%,#ffffff55,transparent_45%),radial-gradient(closest-side,transparent_78%,#02091766)] mix-blend-screen"
          />

          {/* pointer: ticks back on every segment */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-[-3%] z-10 -ml-[5%] w-[10%] origin-[50%_20%]"
            style={{ rotate: pointerTilt }}
          >
            <svg viewBox="0 0 40 52" className="w-full overflow-visible drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]">
              <path d="M20 50 L4 14 A16 16 0 1 1 36 14 Z" fill="#ddf5ff" stroke="#3cfffc" strokeWidth="2" />
              <circle cx="20" cy="15" r="6" fill="#3cfffc" />
            </svg>
          </motion.div>

          {/* hub = the Spin button */}
          <button
            type="button"
            onClick={() => void spin(1)}
            disabled={phase !== "idle"}
            className={cn(
              "glass absolute left-1/2 top-1/2 z-10 grid size-[24%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
              "text-sm font-bold uppercase tracking-widest text-white outline-none transition-transform sm:text-base",
              "focus-visible:ring-4 focus-visible:ring-aqua/60 enabled:hover:scale-105 enabled:active:scale-95 disabled:opacity-90",
              phase === "idle" && "shadow-[0_0_30px_-4px_#3cfffc]",
            )}
          >
            <span className="glass-sheen" />
            {phase === "spinning" ? <Loader2 aria-hidden className="size-6 animate-spin" /> : phase === "idle" ? "Spin" : "Done"}
          </button>
        </motion.div>
      </div>

      <p className="text-xs text-ice/55">Tap Spin, or drag the wheel and let go</p>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
