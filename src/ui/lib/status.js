// Shared vitality colour mapping (leadership, stability, city vitality). One
// source for the band and its thresholds so the DOM readouts and the MapLibre
// paint expressions can never drift apart.
//
// Three inks and no more: green reads healthy, red reads danger, and the middle
// band carries no colour at all, so a number only turns a colour when the
// colour means something.

export const VIT_GREEN = "#5fe39a",
    VIT_WHITE = "#ffffff",
    VIT_RED = "#e0574f";

// A 0..100 percentage → band colour (leadership / stability HUD readouts).
// Returns undefined for a null/absent value so callers can leave colour unset.
export function vitColor(pct) {
    if (pct == null) return undefined;
    if (pct >= 67) return VIT_GREEN;
    if (pct >= 34) return VIT_WHITE;
    return VIT_RED;
}

// MapLibre paint expression mapping a 0..1 `vit` feature property to the same
// red → white → green band, so map circles match the HUD colours exactly.
export function vitPaint(prop = "vit") {
    return ["interpolate", ["linear"], ["get", prop], 0, VIT_RED, 0.5, VIT_WHITE, 1, VIT_GREEN];
}
