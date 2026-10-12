# Spin to Unlock

A premium, liquid-glass round prize wheel for Next.js 16 (App Router, React 19, TypeScript),
built with Tailwind CSS 4, shadcn/ui, Motion (`motion/react`) and Lucide icons.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Flow

| # | Stage | Inspired by (SVGator templates) | File |
|---|---|---|---|
| 1 | Welcome | Liquid glass marketing intro, title card | `components/spin/intro-scene.tsx` |
| 2 | Prize wheel | Custom SVG dial wheel (navy segments, line icons, tick bezel) | `components/spin/prize-wheel.tsx` |
| 3 | Gift box opens | Reward gift box animation | `components/spin/gift-box-scene.tsx` |
| 4 | Product reveal | Product showcase, image reveal effect | `components/spin/reveal-scene.tsx` |

Options in `components/spin/spin-experience.tsx`:

- `WHEEL_FACES = "prizes"` (default) shows each prize's line icon (or image) and name.
  `"gifts"` shows the same gift icon on every segment, so the prize stays a surprise
  until stage 3.
- `SHOW_SHUFFLE = true` adds the card-slider shuffle
  (`shuffle-scene.tsx`, liquid glass single card slider) between stages 2 and 3.

**Prize images:** add a picture to `public/prizes/` and set `image: "/prizes/name.png"`
on that prize in `lib/prizes.ts`. It appears on the gift-box and reveal stages (and on the
wheel in `"prizes"` mode). Transparent, roughly square PNG or SVG works best. Without an
image, the prize's Lucide icon is used.

Returning visitors go straight to stage 4.

All animation is written in code (no video files), so the wheel can land on any
prize the server chooses.

## How it fits together

- `app/page.tsx` – Server Component. Reads the result cookie inside `<Suspense>`
  (required because `cacheComponents` is on) and passes prizes **without odds**
  to the client.
- `app/actions.ts` – Server Actions. `spinWheel()` picks the prize with
  `crypto.randomInt` and stores it; the client only animates to the returned index.
  `resetSpin()` works in development only.
- `lib/prizes.ts` – prize list, weights, campaign copy. Server-only.
- `components/spin/spin-experience.tsx` – the single `"use client"` boundary that
  switches scenes.
- `components/ui/button.tsx` – shadcn/ui Button with an extra `glass` variant.
  `components.json` is set up, so `npx shadcn@latest add <component>` works.

## Interaction

- Tap the Spin hub, or drag the wheel around and let go (mouse and touch). A fast
  flick spins in that direction. The pointer flicks back on every segment.
- Tick and win sounds are synthesised with Web Audio (no files), with a mute toggle.
  Light haptic tick on Android.
- `prefers-reduced-motion`: the wheel jumps to the result and transform animations
  are skipped (`MotionConfig reducedMotion="user"`).
- Result is announced through an `aria-live` region; everything is keyboard-usable.

## Performance notes

- The wheel is one GPU-composited `rotate` driven by a MotionValue, so React does
  not re-render per frame.
- Only the segment layer rotates; the glass rim, lights, gloss and hub are static, so
  backdrop blur (`glass`) never sits on a moving layer.

## Before production

1. Replace the demo cookie with a database row: signed-in user,
   `UNIQUE(user_id, campaign_id)`, rate limiting and an audit log (see comments in
   `app/actions.ts`).
2. Replace placeholder prizes and the `Your Brand` text in `lib/prizes.ts`.
3. Point the "Claim prize" link at your real claim flow.
4. Get compliance sign-off. In the EU/UK, retail CFD clients may not be offered
   monetary or non-monetary benefits; in the US, chance-based prizes need official
   rules and a free way to enter.
