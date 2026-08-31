// The facing marker a mover carries while under way (sim/aircraft.js — steamShip).
// The UI reads a sprite's heading from the projected hull->face vector and needs a
// minimum screen length to get an angle out of it, so the marker has to sit a
// CONSTANT distance ahead on the current course. Held on the waypoint instead it
// collapses to nothing as the hull arrives, and the sprite loses its heading and
// snaps upright at every mark of a route. Deterministic — pure geometry.
import {describe, expect, it} from "vitest";
import {steamShip} from "../../../src/game/sim/aircraft.js";
import {UNITS} from "../../../src/game/data/units.js";
import {bearing, haversine} from "../../../src/game/geo/geo.js";

// A coastal-style route: several marks, the shape setSail plots around land.
const LEGS = [
    {lng: -49, lat: 40},
    {lng: -48, lat: 41},
    {lng: -47, lat: 41.5},
    {lng: -45, lat: 42},
];
const mover = (type, route) => ({
    id: "m",
    slot: 0,
    type,
    hp: UNITS[type].hp,
    lng: -50,
    lat: 40,
    cooldown: 0,
    targetId: null,
    dest: {...route[route.length - 1]},
    route: route.map((r) => ({...r})),
});
const faceSep = (u) => haversine(u.lng, u.lat, u.face.lng, u.face.lat);

describe("steamShip facing marker", () => {
    it("test_holds_a_constant_length_across_every_waypoint_of_a_route", () => {
        const u = mover("destroyer", LEGS);
        const seps = [];
        for (let i = 0; i < 40 && u.dest; i++) {
            steamShip(u, UNITS.destroyer, 0.25);
            seps.push(faceSep(u));
        }
        // The hull crossed several marks in that run.
        expect(seps.length).toBeGreaterThan(10);
        // Every marker is the same distance out — no collapse as a mark is reached.
        const lo = Math.min(...seps),
            hi = Math.max(...seps);
        expect(hi - lo).toBeLessThan(1);
        expect(lo).toBeGreaterThan(50);
    });

    it("test_points_along_the_course_being_steamed", () => {
        const u = mover("destroyer", [{lng: -40, lat: 40}]);
        steamShip(u, UNITS.destroyer, 0.5);
        // The marker leads on the hull's actual course — the great-circle bearing
        // to the mark it is steaming for, which on an east-west leg at latitude is
        // several degrees off due east.
        const toMark = bearing(u.lng, u.lat, -40, 40);
        const toFace = bearing(u.lng, u.lat, u.face.lng, u.face.lat);
        expect(Math.abs(toFace - toMark)).toBeLessThan(0.01);
    });

    it("test_keeps_the_final_heading_after_arrival", () => {
        const u = mover("destroyer", [{lng: -49.9, lat: 40}]);
        steamShip(u, UNITS.destroyer, 0.5); // one tick covers the whole leg
        expect(u.dest).toBe(null);
        // Still facing the way it came in, at the same readable length.
        expect(faceSep(u)).toBeGreaterThan(50);
        const inbound = bearing(-50, 40, u.lng, u.lat);
        const toFace = bearing(u.lng, u.lat, u.face.lng, u.face.lat);
        expect(Math.abs(toFace - inbound)).toBeLessThan(0.5);
    });

    it("test_a_slow_ground_unit_still_gets_a_readable_marker", () => {
        // The look-ahead has a floor, so a slow hull's marker does not shrink with
        // its speed until it falls under the renderer's minimum.
        const u = {
            id: "t",
            slot: 0,
            type: "tank",
            hp: UNITS.tank.hp,
            lng: 0,
            lat: 0,
            cooldown: 0,
            targetId: null,
            dest: {lng: 3, lat: 0},
            route: [{lng: 3, lat: 0}],
        };
        steamShip(u, UNITS.tank, 0.5);
        expect(faceSep(u)).toBeGreaterThan(50);
    });

    it("test_a_mover_still_reaches_its_destination", () => {
        // The facing work must not disturb the motion itself.
        const u = mover("destroyer", LEGS);
        let ticks = 0;
        while (u.dest && ticks < 500) {
            steamShip(u, UNITS.destroyer, 0.5);
            ticks++;
        }
        expect(u.dest).toBe(null);
        expect(haversine(u.lng, u.lat, LEGS[3].lng, LEGS[3].lat)).toBeLessThan(1);
    });
});
