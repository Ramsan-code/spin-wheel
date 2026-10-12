// Gift box illustration as plain SVG shapes, drawn in a 100 × 100 box.
// No gradient ids (React's useId format is not always safe inside url(#…)),
// so depth comes from translucent highlight and shadow shapes instead.

export type GiftColors = {
  /** Box colour. */
  box: string;
  /** Ribbon and bow colour. */
  ribbon: string;
};

/** Lid + bow. Separate from the body so the gift-box stage can pop it off. */
export function GiftLid({ box, ribbon }: GiftColors) {
  return (
    <g>
      {/* bow loops */}
      <path d="M50 25 C 38 4, 20 12, 36 25 Z" fill={ribbon} />
      <path d="M50 25 C 62 4, 80 12, 64 25 Z" fill={ribbon} />
      <path d="M50 25 C 41 10, 29 14, 38 23" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="1.6" />
      <circle cx="50" cy="24" r="5.5" fill={ribbon} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="1" />
      {/* lid */}
      <rect x="8" y="26" width="84" height="16" rx="5" fill={box} />
      <rect x="8" y="26" width="84" height="6" rx="3" fill="#ffffff" opacity="0.35" />
      <rect x="44" y="26" width="12" height="16" fill={ribbon} />
    </g>
  );
}

export function GiftBody({ box, ribbon }: GiftColors) {
  return (
    <g>
      <rect x="14" y="40" width="72" height="54" rx="6" fill={box} />
      {/* shade under the lid and on the right side */}
      <rect x="14" y="40" width="72" height="7" fill="#000000" opacity="0.18" />
      <rect x="66" y="40" width="20" height="54" rx="6" fill="#000000" opacity="0.12" />
      {/* glossy highlight */}
      <rect x="20" y="50" width="8" height="36" rx="4" fill="#ffffff" opacity="0.35" />
      <rect x="44" y="40" width="12" height="54" fill={ribbon} />
      <rect x="44" y="40" width="4" height="54" fill="#ffffff" opacity="0.3" />
    </g>
  );
}

/** Complete closed gift, for the wheel segments. */
export function Gift(props: GiftColors) {
  return (
    <g>
      <GiftBody {...props} />
      <GiftLid {...props} />
    </g>
  );
}
