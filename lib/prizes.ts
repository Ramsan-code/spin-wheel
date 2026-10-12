/**
 * Prize configuration. SERVER-ONLY: never import the PRIZES array (with its
 * weights) into a "use client" file. Client code only receives PublicPrize.
 *
 * Placeholders: replace with prizes your compliance team has approved.
 * (EU/UK retail CFD rules ban monetary and non-monetary benefits for retail
 * clients, so trading credits, cash or fee discounts are likely not allowed.)
 */

export type IconKey =
  | "report"
  | "session"
  | "charts"
  | "masterclass"
  | "merch"
  | "calendar"
  | "retry"
  | "webinar";

export type Prize = {
  id: string;
  name: string;
  /** Short label printed on the wheel (keep to 11 characters or fewer). */
  short: string;
  description: string;
  icon: IconKey;
  /** Two muted colours for the prize medallion / reveal panel. */
  from: string;
  to: string;
  /** false = "no prize" segment. */
  win: boolean;
  /**
   * Optional picture of the prize, e.g. "/prizes/hoodie.png" (put the file in
   * public/prizes). Shown on the wheel in "prizes" mode and on the final reveal.
   * Transparent PNG or SVG, roughly square, works best.
   */
  image?: string;
  /** Relative odds. Kept on the server. */
  weight: number;
};

export type PublicPrize = Omit<Prize, "weight">;

export const CAMPAIGN = {
  brand: "Your Brand",
  headline: "Spin to Unlock",
  tagline: "One free spin per member. Every result is decided on our servers.",
  cookie: "sw_result",
} as const;

export const PRIZES: Prize[] = [
  {
    id: "insights-report",
    name: "Market Insights Report",
    short: "Insights",
    description: "Our quarterly macro and sector outlook, delivered to your inbox.",
    icon: "report",
    from: "#0e3a4a",
    to: "#1c7c8c",
    win: true,
    weight: 22,
  },
  {
    id: "strategy-session",
    name: "1:1 Strategy Session",
    short: "1:1 Call",
    description: "30 minutes with one of our market analysts to review your plan.",
    icon: "session",
    from: "#1a2240",
    to: "#3a4a8c",
    win: true,
    weight: 6,
  },
  {
    id: "pro-charts",
    name: "Pro Charting Tools",
    short: "Pro Charts",
    description: "Advanced indicators and multi-chart layouts for 30 days.",
    icon: "charts",
    from: "#0d3b36",
    to: "#1f7a6a",
    win: true,
    weight: 14,
  },
  {
    id: "masterclass",
    name: "Masterclass Seat",
    short: "Masterclass",
    description: "A seat in our next live risk-management masterclass.",
    icon: "masterclass",
    from: "#231f3a",
    to: "#55488a",
    win: true,
    weight: 10,
  },
  {
    id: "merch",
    name: "Branded Hoodie",
    short: "Hoodie",
    description: "A heavyweight hoodie from our member collection.",
    icon: "merch",
    from: "#1c2333",
    to: "#4a5578",
    win: true,
    weight: 4,
  },
  {
    id: "econ-calendar",
    name: "Economic Calendar Pro",
    short: "Calendar",
    description: "Real-time event alerts and consensus forecasts for 30 days.",
    icon: "calendar",
    from: "#142a52",
    to: "#2b5aa8",
    win: true,
    weight: 14,
  },
  {
    id: "so-close",
    name: "So Close",
    short: "Try Again",
    description: "No prize this time. Keep an eye out for the next campaign.",
    icon: "retry",
    from: "#151b2b",
    to: "#2a3248",
    win: false,
    weight: 20,
  },
  {
    id: "vip-webinar",
    name: "VIP Webinar Pass",
    short: "VIP Webinar",
    description: "Access to our members-only weekly market webinar.",
    icon: "webinar",
    from: "#2d2a1e",
    to: "#8a7340",
    win: true,
    weight: 10,
  },
];

export function toPublic(prizes: Prize[] = PRIZES): PublicPrize[] {
  return prizes.map((prize) => {
    const { weight, ...rest } = prize;
    void weight; // odds stay on the server
    return rest;
  });
}
