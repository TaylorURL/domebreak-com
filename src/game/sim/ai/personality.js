// Per-nation personality: a nine-trait bias vector the assessment, doctrine,
// and diplomacy layers read. Seeded once, deterministically, from (world seed,
// slot, iso) — the same nation feels the same across replays of a seed but
// different from its neighbours. The vector is stored on the nation
// (n.personality) as plain data so it serializes with the save, and it is
// seeded lazily on first read: the hash never touches the world's RNG stream,
// so WHEN in a match a nation is first seeded cannot change what it gets.
import {PERSONALITY} from "./tuning.js";

export const TRAITS = [
    "aggression", // bias toward pressing / opening wars
    "paranoia", // extra defense weight, earlier bunker
    "industrialism", // weight on the economy focus axis — how long industry outranks military
    "navalism", // fleet appetite (only meaningful for coastal nations)
    "spaceRush", // bias toward the Space HQ path once GDP allows
    "decapFocus", // willingness to prioritize leadership strikes
    "loyalty", // readiness to honor alliances vs backstab
    "vindictiveness", // weight of the grudge ledger on future decisions
    "patience", // readiness to endure a stall vs sue for peace
];

// Small deterministic hash stream over (seed, slot, iso). Deliberately not the
// world PRNG: drawing from that stream would make a nation's traits depend on
// how many draws preceded them, and would perturb every later draw in turn.
function traitStream(seed, slot, iso) {
    let h = (seed >>> 0) ^ Math.imul(slot + 1, 0x9e3779b1);
    for (let i = 0; i < (iso || "").length; i++) h = Math.imul(h ^ iso.charCodeAt(i), 0x85ebca6b);
    return () => {
        h = (h + 0x6d2b79f5) | 0;
        let t = Math.imul(h ^ (h >>> 15), 1 | h);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// The nation's personality, seeding it on first read. Values live in
// [floor, floor + span] and are rounded so saves stay byte-stable.
export function ensurePersonality(w, n) {
    if (n.personality) return n.personality;
    const next = traitStream(w.seed || 1, n.slot, n.iso);
    const p = {};
    for (const t of TRAITS) p[t] = Math.round((PERSONALITY.floor + PERSONALITY.span * next()) * 100) / 100;
    n.personality = p;
    return p;
}
