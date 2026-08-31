// Focus: how a nation's next budget window should split across the spending
// axes. The doctrine layer multiplies each of its want groups by the matching
// axis weight, so focus is the knob that makes two nations running the same
// doctrine buy different things.

// The spending axes, in the order the doctrines consume them.
export const AXES = ["economy", "radar", "defense", "offense", "warheads", "ground", "air", "navy", "space"];

// Weights per axis, roughly 0..2. Reactive by construction: the neighbours'
// force profiles, the live threat map, posture, and personality all move it,
// so a nation re-weights every think without any per-situation special case.
export function assessFocus(frame, posture, personality) {
    const f = {
        economy: 1,
        radar: 0.6,
        defense: 0.8,
        offense: 0.6,
        warheads: 0.5,
        ground: 0.4,
        air: 0.4,
        navy: 0.2,
        space: 0.1,
    };

    // Economy tapers as the industrial base fills; industrialists hold it longer.
    const indFill = Math.min(
        1,
        frame.me.units.filter((u) => ["factory", "port", "refinery", "techpark"].includes(u.type)).length /
            Math.max(1, frame.me.indCap),
    );
    f.economy *= (1.4 - indFill) * (0.7 + 0.6 * personality.industrialism);

    // Paranoia widens both the shield and the picture; live inbound pressure on
    // our own ground only buys more shield.
    f.defense *= (0.7 + 0.6 * personality.paranoia) * (1 + Math.min(1.5, frame.pressure / 40));
    f.radar *= 0.7 + 0.6 * personality.paranoia;

    // What the neighbours actually field reshapes the answer: a strike-heavy
    // force pulls defense and radar up, a ground-heavy one pulls our own ground
    // arm up, a broadly aggressive one pulls both sides of the exchange up.
    // Declared enemies count at full weight and everyone else at 0.4, because a
    // rival's arsenal still has to be answered before it is pointed at us.
    // Allies are skipped outright — theirs never will be.
    for (const slot in frame.world.profiles) {
        if (frame.n.relations[slot] === "ally") continue;
        const p = frame.world.profiles[slot];
        const w = frame.world.enemies.some((e) => e.slot === +slot) ? 1 : 0.4;
        if (p.posture === "first-strike") {
            f.defense += 0.5 * w;
            f.radar += 0.3 * w;
        }
        if (p.posture === "steamroller") {
            f.ground += 0.5 * w;
            f.defense += 0.2 * w;
        }
        if (p.posture === "aggressive") {
            f.defense += 0.2 * w;
            f.offense += 0.2 * w;
        }
    }

    const mode = posture.mode;
    if (mode === "turtle") {
        f.defense *= 1.6;
        f.radar *= 1.3;
        f.offense *= 0.5;
        f.ground *= 0.6;
    }
    if (mode === "press") {
        f.offense *= 1.3;
        f.warheads *= 1.3;
    }
    if (mode === "blitz") {
        f.offense *= 1.5;
        f.warheads *= 1.5;
        f.ground *= 1.5;
    }
    if (mode === "decap") {
        f.offense *= 1.6;
        f.warheads *= 1.7;
    }

    // Navy is assigned rather than scaled, so a landlocked nation lands on a
    // hard zero and never buys a hull it could not float.
    if (frame.me.coastal) f.navy = (0.3 + personality.navalism) * (frame.world.atWar ? 1.2 : 0.9);
    else f.navy = 0;
    f.air *= 0.8 + 0.5 * posture.aggression;
    f.space = personality.spaceRush * Math.min(1.5, frame.me.gdp / 8);

    // Bound every axis so a stack of hot multipliers can't turn one appetite
    // into a runaway urgency that starves the rest of the doctrine.
    for (const k in f) f[k] = Math.min(2, f[k]);
    return f;
}
