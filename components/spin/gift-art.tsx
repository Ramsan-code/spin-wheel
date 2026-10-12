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
