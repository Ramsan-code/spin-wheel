"use client";

import { useCallback, useRef } from "react";

/**
 * Tick + win sounds synthesised with Web Audio: no audio files to download,
 * and no <audio> element lag on iOS / Firefox mobile.
 * Browsers only allow audio after a user gesture, so call `unlock()` from the
 * click handler that starts the spin.
 */
export function useWheelSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastTickRef = useRef(0);

  const unlock = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!ctxRef.current) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
  }, []);

  const blip = useCallback(
    (freq: number, start: number, length: number, volume: number, type: OscillatorType) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + length + 0.02);
    },
    [],
  );

  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!enabled || !ctx) return;
    const now = performance.now();
    if (now - lastTickRef.current < 28) return; // throttle at high speed
    lastTickRef.current = now;
    blip(1900, ctx.currentTime, 0.035, 0.08, "triangle");
    if ("vibrate" in navigator) navigator.vibrate?.(6);
  }, [enabled, blip]);

  const chime = useCallback(
    (win: boolean) => {
      const ctx = ctxRef.current;
      if (!enabled || !ctx) return;
      const notes = win ? [523.25, 659.25, 783.99, 1046.5] : [392, 329.63];
      notes.forEach((f, i) => blip(f, ctx.currentTime + i * 0.09, 0.45, 0.12, "sine"));
    },
    [enabled, blip],
  );

  return { unlock, tick, chime };
}
