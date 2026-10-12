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
  /** Short label printed on the wheel card. */
  short: string;
  description: string;
  icon: IconKey;
  /** Two colours for the card gradient / reveal panel. */
  from: string;
  to: string;
  /** false = "no prize" segment. */
  win: boolean;
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
    short: "Insights Report",
    description: "Our quarterly macro and sector outlook, delivered to your inbox.",
    icon: "report",
    from: "#3cfffc",
    to: "#2b6cff",
    win: true,
    weight: 22,
  },
  {
    id: "strategy-session",
    name: "1:1 Strategy Session",
    short: "Strategy Session",
    description: "30 minutes with one of our market analysts to review your plan.",
    icon: "session",
    from: "#8b7bff",
    to: "#ff6ad5",
    win: true,
    weight: 6,
  },
  {
    id: "pro-charts",
    name: "Pro Charting Tools",
    short: "Pro Charts",
    description: "Advanced indicators and multi-chart layouts for 30 days.",
    icon: "charts",
    from: "#00e0a4",
    to: "#3cfffc",
    win: true,
    weight: 14,
  },
  {
    id: "masterclass",
    name: "Masterclass Seat",
    short: "Masterclass",
    description: "A seat in our next live risk-management masterclass.",
    icon: "masterclass",
    from: "#ffb86b",
    to: "#ff6ad5",
    win: true,
    weight: 10,
  },
  {
    id: "merch",
    name: "Branded Hoodie",
    short: "Hoodie",
    description: "A heavyweight hoodie from our member collection.",
    icon: "merch",
    from: "#ddf5ff",
    to: "#8b7bff",
    win: true,
    weight: 4,
  },
  {
    id: "econ-calendar",
    name: "Economic Calendar Pro",
    short: "Calendar Pro",
    description: "Real-time event alerts and consensus forecasts for 30 days.",
    icon: "calendar",
    from: "#2b6cff",
    to: "#8b7bff",
    win: true,
    weight: 14,
  },
  {
    id: "so-close",
    name: "So Close",
    short: "So Close",
    description: "No prize this time. Keep an eye out for the next campaign.",
    icon: "retry",
    from: "#192034",
    to: "#4a5578",
    win: false,
    weight: 20,
  },
  {
    id: "vip-webinar",
    name: "VIP Webinar Pass",
    short: "VIP Webinar",
    description: "Access to our members-only weekly market webinar.",
    icon: "webinar",
    from: "#ff6ad5",
    to: "#3cfffc",
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
