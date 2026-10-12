// Premium gift box: matte navy with hairline edges and a thin aqua ribbon.
// Drawn in a 100 × 100 box. Plain shapes only (no gradient ids), so it can be
// rendered any number of times on a page.

const NAVY = "#0f182b";
const LID = "#141f37";
const EDGE = "#ddf5ff";
const RIBBON = "#3cfffc";

/** Lid + bow. Separate from the body so the reward stage can lift it. */
export function GiftLid() {
  return (
    <g>
      {/* minimal bow: two outlined loops */}
      <path d="M50 27 C 42 14, 30 15, 34 23 C 36 27, 44 27, 50 27 Z" fill="none" stroke={RIBBON} strokeWidth="1.6" />
      <path d="M50 27 C 58 14, 70 15, 66 23 C 64 27, 56 27, 50 27 Z" fill="none" stroke={RIBBON} strokeWidth="1.6" />
      <rect x="10" y="28" width="80" height="13" rx="2.5" fill={LID} stroke={EDGE} strokeOpacity="0.35" strokeWidth="0.8" />
      <rect x="10.5" y="28.5" width="79" height="3" rx="1.5" fill="#ffffff" opacity="0.08" />
      <rect x="48.5" y="28" width="3" height="13" fill={RIBBON} />
    </g>
  );
}

export function GiftBody() {
  return (
    <g>
      <rect x="15" y="41" width="70" height="51" rx="2.5" fill={NAVY} stroke={EDGE} strokeOpacity="0.3" strokeWidth="0.8" />
      {/* soft vertical sheen */}
      <rect x="21" y="45" width="5" height="43" rx="2.5" fill="#ffffff" opacity="0.06" />
      <rect x="15" y="41" width="70" height="4" fill="#000000" opacity="0.25" />
      <rect x="48.5" y="41" width="3" height="51" fill={RIBBON} />
    </g>
  );
}

/**
 * Wheel-segment gift (gift option 1): a tinted box with a slim ribbon and an
 * outlined bow, drawn in a 100 × 100 box. Uses the gradients `pw-gshade` and
 * `pw-glid`, which the wheel defines once in its <defs>.
 */
export function WheelGift({ box, ribbon }: { box: string; ribbon: string }) {
  return (
    <g>
      <rect x="16" y="44" width="68" height="50" rx="4" fill={box} />
      <rect x="16" y="44" width="68" height="50" rx="4" fill="url(#pw-gshade)" />
      <rect x="16" y="44" width="68" height="5" fill="#000000" opacity="0.22" />
      <rect x="47.5" y="44" width="5" height="50" fill={ribbon} />
      <rect x="10" y="31" width="80" height="15" rx="3.5" fill={box} />
      <rect x="10" y="31" width="80" height="15" rx="3.5" fill="url(#pw-glid)" />
      <rect x="47.5" y="31" width="5" height="15" fill={ribbon} />
      <path
        d="M50 31 C 40 13, 25 16, 31 26 C 34 31, 44 31, 50 31 Z"
        fill={ribbon}
        fillOpacity="0.25"
        stroke={ribbon}
        strokeWidth="2.4"
      />
      <path
        d="M50 31 C 60 13, 75 16, 69 26 C 66 31, 56 31, 50 31 Z"
        fill={ribbon}
        fillOpacity="0.25"
        stroke={ribbon}
        strokeWidth="2.4"
      />
      <circle cx="50" cy="30" r="4.2" fill={ribbon} />
      <rect x="10.5" y="31.5" width="79" height="14" rx="3" fill="none" stroke="#ffffff" strokeOpacity="0.28" />
      <rect x="16.5" y="44.5" width="67" height="49" rx="3.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
    </g>
  );
}
