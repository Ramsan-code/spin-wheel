// Shared cubic-bezier curves (typed as tuples so Motion accepts them).
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
/** Long, satisfying deceleration for the main spin. */
export const EASE_SPIN = [0.13, 0.82, 0.2, 1] as const;
