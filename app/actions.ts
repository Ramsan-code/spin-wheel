"use server";

import { randomInt } from "node:crypto";
import { cookies } from "next/headers";

import { CAMPAIGN, PRIZES } from "@/lib/prizes";

export type SpinResult =
  | { ok: true; index: number }
  | { ok: false; error: "ALREADY_SPUN"; index: number };

/** Weighted pick using a CSPRNG (Math.random is not acceptable for prizes). */
function pickIndex(): number {
  const total = PRIZES.reduce((sum, p) => sum + p.weight, 0);
  let roll = randomInt(total);
  for (let i = 0; i < PRIZES.length; i++) {
    roll -= PRIZES[i].weight;
    if (roll < 0) return i;
  }
  return PRIZES.length - 1;
}

/**
 * The server decides the prize. The client only animates to the index it gets
 * back, so editing client code cannot change the result.
 *
 * DEMO STORAGE: the result is kept in an httpOnly cookie, which a visitor can
 * clear to spin again. For production:
 *   1. require a signed-in user (auth()),
 *   2. insert into a `spins` table with UNIQUE(user_id, campaign_id) and treat
 *      a unique-violation as ALREADY_SPUN (this is what stops double spins
 *      from parallel requests),
 *   3. rate-limit by user + IP (e.g. Upstash Redis) and log every spin.
 */
export async function spinWheel(): Promise<SpinResult> {
  const store = await cookies();
  const previous = store.get(CAMPAIGN.cookie)?.value;
  const previousIndex = PRIZES.findIndex((p) => p.id === previous);
  if (previousIndex !== -1) {
    return { ok: false, error: "ALREADY_SPUN", index: previousIndex };
  }

  const index = pickIndex();
  store.set(CAMPAIGN.cookie, PRIZES[index].id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { ok: true, index };
}

/** Development helper so you can test the flow repeatedly. */
export async function resetSpin(): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  const store = await cookies();
  store.delete(CAMPAIGN.cookie);
}
