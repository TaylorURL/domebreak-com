// Scalar range helpers shared by the sim math, the UI, and the map effects, so
// clamping and normalizing behave identically wherever they are applied.

export function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
}

export function clamp01(x) {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}

// Clamp into the symmetric interval [-limit, limit].
export function clampSym(x, limit) {
    return x < -limit ? -limit : x > limit ? limit : x;
}

// Linearly normalize x from [lo, hi] into [0, 1], clamped at both endpoints.
// A zero-width band degenerates to a step: 1 at or above the endpoint, else 0.
// This is the zoom-fade / opacity-band primitive the map effects and the
// attract sim share.
export function norm01(x, lo, hi) {
    if (hi === lo) return x >= hi ? 1 : 0;
    const t = (x - lo) / (hi - lo);
    return t < 0 ? 0 : t > 1 ? 1 : t;
}
