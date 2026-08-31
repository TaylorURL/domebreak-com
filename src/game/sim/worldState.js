// Shared low-level world helpers used across the sim modules: nation lookup,
// the deterministic PRNG, and monotonic id allocation. Never exported from the
// public engine facade — internal plumbing only.

// Slots are assigned 0..N-1 in array order at setup, so nations[slot] is almost
// always the nation — an O(1) hit that matters with the whole world on the roster
// (~222 nations) and this called deep inside the tick's hot loops. Falls back to a
// linear scan for any world whose ordering doesn't hold.
export const nationOf = (w, slot) => {
    const direct = w.nations[slot];
    if (direct && direct.slot === slot) return direct;
    return w.nations.find((n) => n.slot === slot);
};

// Next value in the world's mulberry32 stream, 0..1. The state lives on the world
// as `_r` and advances on every call, so two worlds only stay in step while they
// draw the same values in the same order.
export function rand(world) {
    let a = world._r | 0;
    a = (a + 0x6d2b79f5) | 0;
    world._r = a;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Allocate the next id with prefix `p` ("u" units, "p" projectiles, "e" events,
// "so" sorties, and so on) off one counter shared by every kind. The counter is
// monotonic per world and serializes with it, so an id is never reused even after
// the thing it named is gone.
export function nextId(world, p) {
    world._id = (world._id || 0) + 1;
    return p + world._id;
}
