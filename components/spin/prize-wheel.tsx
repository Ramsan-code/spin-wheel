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
import { Gift, Loader2, Volume2, VolumeX } from "lucide-react";

import { spinWheel, type SpinResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { PublicPrize } from "@/lib/prizes";
import { cn } from "@/lib/utils";
import { EASE_SPIN } from "./easing";
import { PRIZE_ICONS } from "./icons";
import type { WheelSound } from "./use-wheel-sound";

/**
 * "prizes" (default): each segment shows the prize's line icon (or image) and name.
 * "gifts":  every segment shows the same gift icon, so the prize stays a surprise.
 */
export type WheelFaces = "prizes" | "gifts";

type Phase = "idle" | "spinning" | "landed";

const TURNS = 6;
const VB = 210; // viewBox half-size for the full dial
const R = 170; // segment radius
const INSET = `${((VB - R) / (VB * 2)) * 100}%`; // where the rotating disc sits
const SEG_FILLS = ["#101b31", "#0c1424"];
const ICE = "#ddf5ff";
const AQUA = "#3cfffc";

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

function wedge(r: number, from: number, to: number) {
  const p0 = polar(r, from);
  const p1 = polar(r, to);
  return `M0 0 L${p0.x} ${p0.y} A${r} ${r} 0 0 1 ${p1.x} ${p1.y} Z`;
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
  const [landed, setLanded] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  // Segment under the pointer, shown upright below the wheel (labels on a
  // spinning wheel are often sideways or upside down).
  const [current, setCurrent] = useState(0);
  const { unlock, tick } = sound;

  const n = prizes.length;
  const seg = 360 / n;
  const busy = useRef(false);
  const lastIdx = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const drag = useRef<{ rect: DOMRect; last: number } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Tick + nudge the pointer each time a new segment passes under it.
  useMotionValueEvent(rotate, "change", (v) => {
    const idx = mod(Math.round(-v / seg), n);
    if (idx === lastIdx.current) return;
    lastIdx.current = idx;
    setCurrent(idx);
    if (!busy.current && !drag.current) return;
    tick();
    if (!reduce) {
      pointerTilt.set(-dirRef.current * 10);
      animate(pointerTilt, 0, { type: "spring", stiffness: 600, damping: 18 });
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
        : finished(animate(rotate, start - dir * 8, { duration: 0.35, ease: "easeOut" }));

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
      const jitter = (Math.random() - 0.5) * seg * 0.45;
      const target = current + dir * 360 * TURNS + delta + jitter;

      if (reduce) {
        rotate.set(target);
      } else {
        await finished(animate(rotate, target, { duration: 5.6, ease: EASE_SPIN }));
      }

      setLanded(index);
      setPhase("landed");
      const prize = prizes[index];
      setMessage(
        result.ok
          ? prize.win
            ? `The wheel stopped on ${prize.name}.`
            : "The wheel stopped. No prize this time."
          : `You already spun. Your result: ${prize.name}.`,
      );
      window.setTimeout(() => onLanded(index), reduce ? 300 : 1100);
    },
    [phase, unlock, rotate, reduce, seg, prizes, onLanded],
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
    // Tangential speed at release: positive = clockwise.
    const rx = e.clientX - (d.rect.left + d.rect.width / 2);
    const ry = e.clientY - (d.rect.top + d.rect.height / 2);
    const tangential = (rx * info.velocity.y - ry * info.velocity.x) / (Math.hypot(rx, ry) || 1);
    if (Math.abs(tangential) > 400) {
      void spin(tangential > 0 ? 1 : -1);
    } else {
      animate(rotate, Math.round(rotate.get() / seg) * seg, { type: "spring", stiffness: 300, damping: 26 });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-7 px-4 py-10">
      <div className="flex w-full max-w-sm items-center justify-between">
        <div className="glass relative rounded-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-ice/80">
          <span className="glass-sheen" />1 complimentary spin
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

      <div className="w-[min(90vw,460px)] [perspective:1200px]">
        <motion.div
          ref={wheelRef}
          role="group"
          aria-roledescription="prize wheel"
          aria-label={`Prize wheel with ${n} rewards`}
          className={cn(
            "relative aspect-square w-full select-none [touch-action:none] [transform:rotateX(8deg)]",
            phase === "idle" ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          )}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
        >
          {/* floor shadow */}
          <div className="absolute -bottom-[6%] left-[14%] h-[9%] w-[72%] rounded-[50%] bg-black/70 blur-2xl" />

          {/* real backdrop blur, on a static layer only */}
          <div className="glass absolute inset-[2%] rounded-full" />

          {/* bezel: dial ticks + rim (static) */}
          <svg viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`} className="absolute inset-0 size-full" aria-hidden>
            <defs>
              <radialGradient id="pw-bezel" cx="0.35" cy="0.2" r="0.9">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
                <stop offset="0.6" stopColor="#ffffff" stopOpacity="0.03" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.07" />
              </radialGradient>
            </defs>
            <circle r={200} fill="url(#pw-bezel)" stroke="#ffffff" strokeOpacity={0.16} />
            {Array.from({ length: 72 }, (_, i) => {
              const major = i % 9 === 0;
              const a = polar(major ? 181 : 185, i * 5);
              const b = polar(193, i * 5);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={ICE}
                  strokeOpacity={major ? 0.55 : 0.2}
                  strokeWidth={major ? 1.4 : 1}
                />
              );
            })}
            <circle r={R + 4} fill="#060b16" stroke={AQUA} strokeOpacity={0.35} />
          </svg>

          {/* aqua glow while spinning */}
          <div
            aria-hidden
            className={cn(
              "absolute rounded-full shadow-[0_0_50px_-6px_#3cfffc] transition-opacity duration-700",
              phase === "spinning" ? "opacity-70" : "opacity-0",
            )}
            style={{ inset: INSET }}
          />

          {/* rotating disc */}
          <motion.div className="absolute rounded-full" style={{ inset: INSET, rotate, willChange: "transform" }}>
            <svg viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} className="size-full overflow-visible" aria-hidden>
              {prizes.map((prize, i) => {
                const a = i * seg;
                const edge = polar(R, a - seg / 2);
                const Icon = faces === "gifts" ? Gift : PRIZE_ICONS[prize.icon];
                const dim = faces === "prizes" && !prize.win;
                return (
                  <g key={prize.id}>
                    <path d={wedge(R, a - seg / 2, a + seg / 2)} fill={SEG_FILLS[i % 2]} />
                    <line x1={0} y1={0} x2={edge.x} y2={edge.y} stroke={ICE} strokeOpacity={0.16} />
                    <g transform={`rotate(${a})`} opacity={dim ? 0.78 : 1}>
                      <g transform={`translate(0 ${-R * 0.855})`}>
                        {faces === "prizes" && prize.image ? (
                          <image
                            href={prize.image}
                            x={-15}
                            y={-15}
                            width={30}
                            height={30}
                            preserveAspectRatio="xMidYMid meet"
                          />
                        ) : (
                          <Icon x={-13} y={-13} width={26} height={26} color={AQUA} strokeWidth={1.9} />
                        )}
                      </g>
                      {/* Labels read outward from the centre, like a dial; keep them short.
                          The dark outline (paint-order: stroke) is crisp, not a shadow,
                          and keeps text sharp over any shading. */}
                      {faces === "prizes" && (
                        <text
                          transform={`translate(0 ${-R * 0.555}) rotate(-90)`}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="#ffffff"
                          fontSize={12}
                          fontWeight={600}
                          letterSpacing={0.2}
                          stroke="#070d1a"
                          strokeWidth={2.5}
                          strokeLinejoin="round"
                          paintOrder="stroke"
                        >
                          {prize.short}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
              {landed !== null && (
                <path
                  d={wedge(R - 2, landed * seg - seg / 2, landed * seg + seg / 2)}
                  fill={AQUA}
                  fillOpacity={0.1}
                  stroke={AQUA}
                  strokeWidth={1.5}
                />
              )}
            </svg>
          </motion.div>

          {/* static gloss + inner hub ring over the disc */}
          <svg
            viewBox={`${-VB} ${-VB} ${VB * 2} ${VB * 2}`}
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden
          >
            <defs>
              <radialGradient id="pw-gloss" cx="0.3" cy="0.08" r="0.7">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0.07" />
                <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle r={R} fill="url(#pw-gloss)" />
            <circle r={R * 0.27} fill="#070d1a" stroke={ICE} strokeOpacity={0.14} />
          </svg>

          {/* pointer */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 z-10 -ml-[2.5%] w-[5%] origin-top"
            style={{ top: `${((VB - R - 31) / (VB * 2)) * 100}%`, rotate: pointerTilt }}
          >
            <svg viewBox="0 0 18 30" className="w-full overflow-visible drop-shadow-[0_0_8px_#3cfffc99]">
              <path d="M9 30 L0 0 L18 0 Z" fill={ICE} stroke={AQUA} strokeWidth="1.2" />
            </svg>
          </motion.div>

          {/* hub = Spin button */}
          <button
            type="button"
            onClick={() => void spin(1)}
            disabled={phase !== "idle"}
            className={cn(
              "absolute left-1/2 top-1/2 z-10 grid size-[19.5%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full",
              "border border-aqua/60 bg-[radial-gradient(circle_at_35%_25%,#ffffff38,#ffffff0a_70%)] backdrop-blur-md",
              "text-[11px] font-semibold uppercase tracking-[0.3em] text-white outline-none transition-[scale,box-shadow] duration-200 sm:text-xs",
              "focus-visible:ring-4 focus-visible:ring-aqua/50 enabled:hover:scale-105 enabled:hover:shadow-[0_0_24px_-4px_#3cfffc] enabled:active:scale-95",
            )}
          >
            {phase === "spinning" ? (
              <Loader2 aria-hidden className="size-5 animate-spin text-aqua" />
            ) : (
              <span className="pl-[0.3em]">{phase === "idle" ? "Spin" : "Done"}</span>
            )}
          </button>
        </motion.div>
      </div>

      {/* upright readout of the segment under the pointer */}
      <ReadoutLabel prize={prizes[current]} faces={faces} landed={phase === "landed"} />

      <p className="text-[13px] tracking-wide text-ice/70">Tap Spin, or drag the wheel and release</p>
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}

function ReadoutLabel({ prize, faces, landed }: { prize: PublicPrize; faces: WheelFaces; landed: boolean }) {
  const Icon = faces === "gifts" ? Gift : PRIZE_ICONS[prize.icon];
  return (
    <div
      aria-hidden
      className={cn(
        "glass relative flex min-w-56 items-center justify-center gap-3 rounded-full px-5 py-2.5 transition-shadow duration-500",
        landed && "shadow-[0_0_30px_-6px_#3cfffc]",
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ice/70">
        {landed ? "Result" : "Pointer"}
      </span>
      <span className="h-4 w-px bg-white/20" />
      <Icon className="size-5 shrink-0 text-aqua" strokeWidth={1.9} />
      <span className="text-base font-semibold text-white">{faces === "gifts" ? "Mystery gift" : prize.short}</span>
    </div>
  );
}
