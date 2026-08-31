// Ship-to-ship gunnery: a vessel carrying an anti-ship battery (surfaceKm /
// surfaceDamage / surfaceReload) engages the nearest at-war enemy hull inside that
// reach, on its own cooldown, without halting and without touching the strategic
// missile the same hull may also carry. Deterministic — the contact scan and the
// damage are pure functions of position, war state, and cooldown.
import {describe, expect, it} from "vitest";
import {stepMovement} from "../../../src/game/sim/tickPhases.js";
import {nearestNavalContact} from "../../../src/game/sim/combat.js";
import {UNITS} from "../../../src/game/data/units.js";

// lat 0 keeps 1 deg ~= 111 km, so separations are easy to reason about against
// the reaches in units.js (destroyer 180 km, cruiser 220, battleship 340).
function sea({aType = "destroyer", bType = "destroyer", sepDeg = 1, war = true, extra = {}} = {}) {
    return {
        time: 0,
        _id: 0,
        events: [],
        projectiles: [],
        nations: [
            {slot: 0, relations: war ? {1: "war"} : {}},
            {slot: 1, relations: war ? {0: "war"} : {}},
        ],
        units: [
            {id: "a", slot: 0, type: aType, lng: 0, lat: 0, hp: UNITS[aType].hp, cooldown: 0, targetId: null, ...extra},
            {id: "b", slot: 1, type: bType, lng: sepDeg, lat: 0, hp: UNITS[bType].hp, cooldown: 0, targetId: null},
        ],
        cities: [],
    };
}
const u = (w, id) => w.units.find((x) => x.id === id);

describe("naval surface engagement", () => {
    it("test_ships_in_range_trade_fire_on_their_own_cooldown", () => {
        const w = sea();
        stepMovement(w, 0.5);
        // Both destroyers are inside 180 km of each other, so both open fire.
        expect(u(w, "b").hp).toBe(UNITS.destroyer.hp - UNITS.destroyer.surfaceDamage);
        expect(u(w, "a").hp).toBe(UNITS.destroyer.hp - UNITS.destroyer.surfaceDamage);
        // The battery is on cooldown now — the next tick lands nothing.
        const hpAfterFirst = u(w, "b").hp;
        stepMovement(w, 0.5);
        expect(u(w, "b").hp).toBe(hpAfterFirst);
    });

    it("test_a_ship_out_of_reach_is_not_engaged", () => {
        const w = sea({sepDeg: 3}); // ~333 km, past the destroyer's 180 km battery
        stepMovement(w, 0.5);
        expect(u(w, "b").hp).toBe(UNITS.destroyer.hp);
        expect(u(w, "a").hp).toBe(UNITS.destroyer.hp);
    });

    it("test_ships_at_peace_hold_fire", () => {
        const w = sea({war: false});
        stepMovement(w, 0.5);
        expect(u(w, "b").hp).toBe(UNITS.destroyer.hp);
    });

    it("test_engaging_does_not_halt_a_steaming_ship", () => {
        // Ships fight while they manoeuvre — unlike troops in contact, a fleet
        // under orders keeps its course.
        const w = sea({extra: {dest: {lng: -5, lat: 0}, route: [{lng: -5, lat: 0}]}});
        stepMovement(w, 0.5);
        expect(u(w, "a").lng).toBeLessThan(0); // still making way
        expect(u(w, "b").hp).toBeLessThan(UNITS.destroyer.hp); // and still shooting
    });

    it("test_a_hull_with_no_battery_never_engages", () => {
        // The carrier fights through its air wing and the amphib is a transport;
        // neither carries an anti-ship battery, so neither trades fire.
        expect(UNITS.carrier.surfaceDamage).toBeUndefined();
        const w = sea({aType: "carrier", bType: "amphib"});
        stepMovement(w, 0.5);
        expect(u(w, "b").hp).toBe(UNITS.amphib.hp);
        expect(u(w, "a").hp).toBe(UNITS.carrier.hp);
    });

    it("test_the_heavier_battery_outranges_the_lighter", () => {
        // 300 km: inside the battleship's 340 km reach, outside the destroyer's 180.
        const w = sea({aType: "battleship", bType: "destroyer", sepDeg: 2.7});
        stepMovement(w, 0.5);
        expect(u(w, "b").hp).toBe(UNITS.destroyer.hp - UNITS.battleship.surfaceDamage);
        expect(u(w, "a").hp).toBe(UNITS.battleship.hp); // the destroyer cannot reply
    });
});

describe("nearestNavalContact", () => {
    it("test_finds_the_closest_at_war_vessel_and_ignores_ground_units", () => {
        const w = sea();
        w.units.push({id: "far", slot: 1, type: "cruiser", lng: 0.5, lat: 0, hp: 70, cooldown: 0, targetId: null});
        w.units.push({id: "land", slot: 1, type: "infantry", lng: 0.1, lat: 0, hp: 75, cooldown: 0, targetId: null});
        expect(nearestNavalContact(w, u(w, "a"), 400).id).toBe("far");
    });

    it("test_a_submerged_boat_is_only_a_contact_for_a_hull_with_sonar_in_reach", () => {
        const w = sea({aType: "cruiser"}); // cruiser carries no asw
        w.units[1] = {id: "b", slot: 1, type: "sub-ssn", lng: 0.5, lat: 0, hp: 65, cooldown: 0, targetId: null};
        expect(UNITS.cruiser.asw).toBeUndefined();
        expect(nearestNavalContact(w, u(w, "a"), 400)).toBe(null);
        // A destroyer's sonar does find it.
        const d = {id: "d", slot: 0, type: "destroyer", lng: 0, lat: 0, hp: 60, cooldown: 0, targetId: null};
        w.units.push(d);
        expect(nearestNavalContact(w, d, 400)?.id).toBe("b");
    });
});
