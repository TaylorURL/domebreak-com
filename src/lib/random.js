// Seeded-RNG helpers. Most take a value already sampled in 0..1 — from the
// world's seeded stream, Math.random, or any other source — so the choice of
// stream, and with it determinism, stays with the caller.

// Map a 0..1 sample onto [min, min + span). Names the intent behind the
// `min + rand() * span` pattern used for AI think delays, placement radii, and
// MIRV lane spread.
export function randRange(sample01, min, span) {
    return min + sample01 * span;
}

// Signed uniform sample in (-span/2, +span/2) — the `(sample - 0.5) * span`
// idiom used for MIRV aim scatter and AI placement wobble.
export function jitter(sample01, span) {
    return (sample01 - 0.5) * span;
}

// Pick one item from a list of [item, weight] pairs with probability
// proportional to weight, calling `rng` once for the whole draw. Returns null
// for an empty list, and the last item when the weights sum to zero or less.
export function weightedPick(entries, rng) {
    if (!entries || entries.length === 0) return null;
    let total = 0;
    for (const [, w] of entries) total += w;
    if (total <= 0) return entries[entries.length - 1][0];
    let r = rng() * total;
    for (const [item, w] of entries) {
        r -= w;
        if (r <= 0) return item;
    }
    return entries[entries.length - 1][0];
}
