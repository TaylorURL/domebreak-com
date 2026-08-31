// AWACS patrol from a carrier deck and an airstrip: the picket has to REACH its
// orbit, HOLD it for the bulk of its sortie, and recover cleanly — including from
// a carrier that is under way, which steams at a good fraction of the picket's own
// airspeed. Asserted as behaviour over a run rather than on tuning numbers, so the
// pins survive retuning: what matters is that the orbit is held and the deck is
// given back. Deterministic — flight is a pure function of the tick.
import {describe, expect, it} from "vitest";
import {createWorld, setSail, step, UNITS} from "../../../src/game/engine.js";
import {setAwacsPatrol, setPatrolSize} from "../../../src/game/sim/production.js";
import {haversine} from "../../../src/game/geo/geo.js";
import {AWACS_ORBIT_KM} from "../../../src/game/data/constants.js";

// Five powers with unequal populations, so neither the last-standing nor the
// domination check ends the match mid-run and freezes the sim.
function theatre() {
    const isos = ["USA", "RUS", "CHN", "FRA", "BRA"];
    return createWorld({
        mySlot: 0,
        seed: 3,
        nations: isos.map((iso, i) => ({slot: i, name: iso, iso, isAi: false, gdp: 5})),
        cities: isos.flatMap((iso, i) =>
            [0, 1, 2].map((k) => ({
                id: `${iso}${k}`,
                slot: i,
                name: `${iso}${k}`,
                cap: k === 0 ? 1 : 0,
                pop: 100 + i * 7 + k,
                econ: 1,
                lng: -100 + i * 40 + k * 2,
                lat: 30 + k,
            })),
        ),
        rules: {playerGraceSec: 0},
    });
}

// Fly `baseType` with an AWACS orbit up for `ticks`, and report how the picket
// spent the sortie. `underway` puts a carrier on a course first.
function flyPatrol({baseType, underway = false, ticks = 1200}) {
    const w = theatre();
    w.units.push({
        id: "b1",
        slot: 0,
        type: baseType,
        hp: UNITS[baseType].hp,
        lng: -40,
        lat: 40,
        cooldown: 0,
        targetId: null,
        warhead: null,
    });
    setAwacsPatrol(w, 0, "b1", true);
    if (underway) setSail(w, 0, "b1", -15, 42);
    const base = () => w.units.find((u) => u.id === "b1");
    let onStation = 0,
        aloft = 0,
        deckHeld = 0,
        goArounds = 0,
        maxUp = 0;
    let orbitLo = Infinity,
        orbitHi = 0;
    const prevAlt = new Map();
    for (let i = 0; i < ticks; i++) {
        step(w, 0.5, false);
        const b = base();
        if (b.op) deckHeld++;
        const up = w.units.filter((u) => u.type === "awacs" && u.hp > 0);
        maxUp = Math.max(maxUp, up.length);
        for (const a of up) {
            aloft++;
            if (a.phase === "cruise") {
                onStation++;
                const d = haversine(b.lng, b.lat, a.lng, a.lat);
                orbitLo = Math.min(orbitLo, d);
                orbitHi = Math.max(orbitHi, d);
            }
            // A go-around is a jet that was down on final and climbed away again.
            const p = prevAlt.get(a.id);
            if (p != null && p < 0.3 && (a.alt ?? 0) > 0.9) goArounds++;
            prevAlt.set(a.id, a.alt ?? 0);
        }
    }
    return {
        onStationFrac: aloft ? onStation / aloft : 0,
        deckHeldFrac: deckHeld / ticks,
        goArounds,
        maxUp,
        orbitLo,
        orbitHi,
    };
}

describe("AWACS patrol", () => {
    for (const [name, opts] of [
        ["an airstrip", {baseType: "airstrip"}],
        ["a moored carrier", {baseType: "carrier"}],
        ["a carrier under way", {baseType: "carrier", underway: true}],
    ]) {
        it(`test_holds_the_radar_orbit_launched_from_${name.replace(/\W+/g, "_")}`, () => {
            const r = flyPatrol(opts);
            // The picket exists to give persistent coverage: the bulk of its time
            // aloft has to be spent on station, not in transit or the pattern.
            expect(r.onStationFrac).toBeGreaterThan(0.8);
            // It actually reaches the orbit ring rather than circling near the deck.
            expect(r.orbitHi).toBeGreaterThan(AWACS_ORBIT_KM * 0.9);
            expect(r.orbitLo).toBeLessThan(AWACS_ORBIT_KM * 1.2);
            // A blown approach that repeats is the failure this guards: the picket
            // loops the pattern burning the deck it is holding.
            expect(r.goArounds).toBe(0);
            expect(r.deckHeldFrac).toBeLessThan(0.15);
            // One orbit was asked for; one is kept.
            expect(r.maxUp).toBe(1);
        });
    }

    it("test_the_picket_outlasts_a_fighters_cap_cycle", () => {
        // An AEW aircraft's whole job is endurance; on a fighter's fuel it spends
        // the sortie commuting instead of watching.
        expect(UNITS.awacs.patrolFuel).toBeGreaterThan(120);
    });

    it("test_a_fighter_cap_still_launches_and_holds_its_requested_strength", () => {
        // The AWACS must not monopolise the deck: a CAP asked for alongside it
        // still gets airborne and stays at strength.
        const w = theatre();
        w.units.push({
            id: "b1",
            slot: 0,
            type: "carrier",
            hp: UNITS.carrier.hp,
            lng: -40,
            lat: 40,
            cooldown: 0,
            targetId: null,
            warhead: null,
        });
        setAwacsPatrol(w, 0, "b1", true);
        setPatrolSize(w, 0, "b1", 2);
        let peakFighters = 0,
            sawAwacs = false;
        for (let i = 0; i < 800; i++) {
            step(w, 0.5, false);
            peakFighters = Math.max(
                peakFighters,
                w.units.filter((u) => u.type === "carrierfighter" && u.hp > 0).length,
            );
            if (w.units.some((u) => u.type === "awacs" && u.hp > 0)) sawAwacs = true;
        }
        expect(peakFighters).toBe(2);
        expect(sawAwacs).toBe(true);
    });
});
