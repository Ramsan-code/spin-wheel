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
import { Loader2, RotateCw, Volume2, VolumeX } from "lucide-react";

import { spinWheel, type SpinResult } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { PublicPrize } from "@/lib/prizes";
import { cn } from "@/lib/utils";
import { EASE_SPIN } from "./easing";
import { PRIZE_ICONS } from "./icons";
import { useWheelSound } from "./use-wheel-sound";

type Phase = "idle" | "spinning" | "landed";

const TURNS = 6;
const MAX_STAGE = 960;

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Await a Motion animation without depending on its exact Promise typing. */
const finished = (controls: { then: (resolve: () => void) => unknown }) =>
  new Promise<void>((resolve) => {
    controls.then(resolve);
  });

/**
 * Layout for a given stage width. The wheel's hub sits below the visible
 * area, so only the top arc shows: three cards fanned out, like the SVGator
 * "rotating fan of promo cards" template.
 */
function geometry(width: number, count: number) {
  const cardW = Math.round(Math.max(128, Math.min(width * 0.36, 188)));
  const cardH = Math.round(cardW * 1.36);
  const radius = Math.round(Math.max(cardW * 1.9, Math.min(width * 0.55, 470)));
  const pointer = 30;
  const cy = 14 + pointer + cardH / 2 + radius;
  const seg = 360 / count;
  const height = Math.round(cy - radius * Math.cos((seg * Math.PI) / 180) + cardH * 0.6);
  return { cardW, cardH, radius, cy, seg, height, pointer };
}

type Props = {
  prizes: PublicPrize[];
  onLanded: (index: number) => void;
};

export function CardWheel({ prizes, onLanded }: Props) {
  const reduce = useReducedMotion();
  const rotate = useMotionValue(0);
  const [width, setWidth] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const { unlock, tick, chime } = useWheelSound(soundOn);

  const busy = useRef(false);
  const dragStart = useRef<number | null>(null);
  const lastIdx = useRef(0);

  const n = prizes.length;
  const g = geometry(Math.min(width ?? MAX_STAGE, MAX_STAGE), n);

  // Measure the stage with a callback ref (React 19 ref cleanup).
  const measureRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  // Which card is under the pointer. Fires outside React's render loop; we only
  // set state when the index actually changes (once per card, not per frame).
  useMotionValueEvent(rotate, "change", (v) => {
    const idx = mod(Math.round(-v / g.seg), n);
    if (idx !== lastIdx.current) {
      lastIdx.current = idx;
      setActive(idx);
      if (busy.current || dragStart.current !== null) tick();
    }
  });

  const spin = useCallback(
    async (dir: 1 | -1 = 1) => {
      if (busy.current || phase !== "idle") return;
      busy.current = true;
      unlock();
      setPhase("spinning");
      setMessage("Spinning…");

      const start = rotate.get();
      // Small wind-up while the server picks the prize (usually < 300 ms).
      const windUp = reduce
        ? Promise.resolve()
        : finished(animate(rotate, start - dir * 9, { duration: 0.35, ease: "easeOut" }));

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
      const desired = -index * g.seg;
      const delta = dir > 0 ? mod(desired - current, 360) : -mod(current - desired, 360);
      const target = current + dir * 360 * TURNS + delta;

      if (reduce) {
        rotate.set(target);
      } else {
        // Long ease-out, slight overshoot, then a springy settle on the card.
        await finished(animate(rotate, target + dir * 3, { duration: 5.4, ease: EASE_SPIN }));
        await finished(animate(rotate, target, { type: "spring", stiffness: 260, damping: 15 }));
      }

      const prize = prizes[index];
      setActive(index);
      setPhase("landed");
      chime(prize.win);
      setMessage(
        result.ok
          ? prize.win
            ? `You won: ${prize.name}`
            : "No prize this time."
          : `You already spun. Your result: ${prize.name}`,
      );
      window.setTimeout(() => onLanded(index), reduce ? 300 : 1100);
    },
    [phase, unlock, rotate, reduce, g.seg, prizes, chime, onLanded],
  );

  // Drag the fan with a finger or mouse; a fast flick starts a real spin.
  const onPanStart = () => {
    if (busy.current) return;
    unlock();
    dragStart.current = rotate.get();
  };
  const onPan = (_: PointerEvent, info: PanInfo) => {
    if (dragStart.current === null) return;
    const degPerPx = 180 / (Math.PI * g.radius);
    rotate.set(dragStart.current + info.offset.x * degPerPx);
  };
  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (Math.abs(info.velocity.x) > 350) {
      void spin(info.velocity.x > 0 ? 1 : -1);
    } else {
      const snapped = Math.round(rotate.get() / g.seg) * g.seg;
      animate(rotate, snapped, { type: "spring", stiffness: 300, damping: 26 });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-4 py-10 sm:py-14">
      <div className="flex w-full max-w-md items-center justify-between">
        <div className="glass relative rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-ice/85">
          <span className="glass-sheen" />
          1 free spin
        </div>
        <Button
          variant="glass"
          size="icon"
          aria-pressed={soundOn}
          aria-label={soundOn ? "Mute sound" : "Turn sound on"}
          onClick={() => setSoundOn((s) => !s)}
        >
          {soundOn ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
        </Button>
      </div>

      {/* Stage */}
      <div ref={measureRef} className="w-full" style={{ maxWidth: MAX_STAGE }}>
        <motion.div
          role="group"
          aria-roledescription="prize wheel"
          aria-label={`Prize wheel with ${n} prizes`}
          className={cn(
            "relative mx-auto w-full select-none overflow-hidden [perspective:1200px] [touch-action:pan-y]",
            phase === "idle" ? "cursor-grab active:cursor-grabbing" : "cursor-default",
          )}
          style={{
            height: g.height,
            maskImage: "linear-gradient(to bottom, black 70%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: width === null ? 0 : 1 }}
          transition={{ duration: 0.5 }}
          onPanStart={onPanStart}
          onPan={onPan}
          onPanEnd={onPanEnd}
        >
          {/* tilted plane = the "3D" look, a single static transform */}
          <div
            className="absolute inset-0"
            style={{ transform: "rotateX(12deg)", transformOrigin: `50% ${g.cy}px` }}
          >
            <motion.div
              className="absolute left-1/2 size-0"
              style={{ top: g.cy, rotate, willChange: "transform" }}
            >
              {prizes.map((prize, i) => (
                <WheelCard
                  key={prize.id}
                  prize={prize}
                  angle={i * g.seg}
                  radius={g.radius}
                  width={g.cardW}
                  height={g.cardH}
                  active={i === active}
                  landed={phase === "landed" && i === active}
                />
              ))}
            </motion.div>
          </div>

          <Pointer top={14} glowing={phase === "landed"} />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={() => void spin(1)}
          disabled={phase !== "idle"}
          className="min-w-44 bg-aqua text-ink shadow-[0_0_40px_-6px_#3cfffc] hover:bg-ice"
        >
          {phase === "spinning" ? (
            <Loader2 aria-hidden className="animate-spin" />
          ) : (
            <RotateCw aria-hidden />
          )}
          {phase === "idle" ? "Spin" : phase === "spinning" ? "Spinning" : "Done"}
        </Button>
        <p className="text-xs text-ice/55">or flick the cards sideways</p>
        <p aria-live="polite" className="sr-only">
          {message}
        </p>
      </div>
    </div>
  );
}

function WheelCard({
  prize,
  angle,
  radius,
  width,
  height,
  active,
  landed,
}: {
  prize: PublicPrize;
  angle: number;
  radius: number;
  width: number;
  height: number;
  active: boolean;
  landed: boolean;
}) {
  const Icon = PRIZE_ICONS[prize.icon];

  return (
    <div
      className="absolute left-0 top-0"
      style={{
        width,
        height,
        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(${-radius}px)`,
      }}
      aria-hidden
    >
      <motion.div
        className={cn(
          "glass-lite relative flex size-full flex-col items-center justify-between overflow-hidden rounded-[1.6rem] p-4 transition-[box-shadow,border-color] duration-300",
          active && "border-white/50",
        )}
        animate={{ scale: landed ? 1.1 : active ? 1.05 : 0.94 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          boxShadow: landed
            ? `0 0 0 1px ${prize.from}, 0 0 60px -6px ${prize.from}, inset 0 1px 0 #ffffff80`
            : undefined,
        }}
      >
        <span className="glass-sheen" />
        {/* colour glow behind the icon */}
        <div
          className="absolute -top-1/4 left-1/2 size-[120%] -translate-x-1/2 rounded-full opacity-60 blur-2xl"
          style={{ background: `radial-gradient(closest-side, ${prize.from}, transparent)` }}
        />
        <span className="relative self-start rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ice/80">
          {prize.win ? "Prize" : "Try"}
        </span>
        <div
          className="relative grid place-items-center rounded-full border border-white/30 shadow-[inset_0_1px_0_#ffffff90,0_12px_30px_-10px_#000]"
          style={{
            width: width * 0.48,
            height: width * 0.48,
            background: `linear-gradient(145deg, ${prize.from}, ${prize.to})`,
          }}
        >
          <Icon className="text-white drop-shadow" style={{ width: width * 0.22, height: width * 0.22 }} />
        </div>
        <p className="relative text-balance text-center text-sm font-semibold leading-tight text-white sm:text-base">
          {prize.short}
        </p>
      </motion.div>
    </div>
  );
}

function Pointer({ top, glowing }: { top: number; glowing: boolean }) {
  return (
    <div className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2" style={{ top }} aria-hidden>
      <svg width="34" height="30" viewBox="0 0 34 30" className="overflow-visible">
        <defs>
          <linearGradient id="pointer-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#3cfffc" />
          </linearGradient>
        </defs>
        <path
          d="M17 29 L3 6 Q1 1 7 1 L27 1 Q33 1 31 6 Z"
          fill="url(#pointer-fill)"
          stroke="#ffffff"
          strokeOpacity="0.6"
          style={{
            filter: glowing
              ? "drop-shadow(0 0 14px #3cfffc)"
              : "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
          }}
        />
      </svg>
    </div>
  );
}
