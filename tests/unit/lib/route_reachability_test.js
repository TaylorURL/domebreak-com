// Grid routing (geo/seaRoute.js): the component short-circuit and the reused A*
// scratch buffers. Both are pure optimisations — the routes they return must be
// exactly the ones the search would have found — so these pin the behaviour that
// makes them safe: unreachable pairs answer null, reachable ones still route, and
// nothing leaks between calls now that the buffers are shared.
import {describe, expect, it} from "vitest";
import {landRoute, seaRoute} from "../../../src/game/geo/seaRoute.js";

// Endpoints picked on obvious terrain so the assertions do not depend on the
// exact coastline the mask encodes.
const MADRID = [-3.7, 40.4];
const WARSAW = [21.0, 52.2];
const CHICAGO = [-87.6, 41.9];
const MID_ATLANTIC = [-40, 35];
const MID_PACIFIC = [-150, 10];

describe("landRoute", () => {
    it("test_routes_between_two_points_on_the_same_landmass", () => {
        const r = landRoute(...MADRID, ...WARSAW);
        expect(r).not.toBe(null);
        expect(r.length).toBeGreaterThan(0);
        // It ends where it was asked to go.
        const last = r[r.length - 1];
        expect(Math.abs(last.lng - WARSAW[0])).toBeLessThan(2);
        expect(Math.abs(last.lat - WARSAW[1])).toBeLessThan(2);
    });

    it("test_refuses_a_march_across_an_ocean", () => {
        // Europe to North America is not walkable, and the answer must come from
        // the component check rather than an exhaustive sweep of Eurasia.
        expect(landRoute(...MADRID, ...CHICAGO)).toBe(null);
    });

    it("test_answers_an_unreachable_march_promptly", () => {
        // The failure this guards is a search that exhausts the whole landmass
        // before giving up. The AI re-asks on every think, so an unreachable
        // pair answered by exhaustion dominates the tick. Warm the caches first
        // so the one-off component build is not being timed.
        landRoute(...MADRID, ...WARSAW);
        const t = performance.now();
        for (let i = 0; i < 20; i++) landRoute(...MADRID, ...CHICAGO);
        expect((performance.now() - t) / 20).toBeLessThan(2);
    });
});

describe("seaRoute", () => {
    it("test_routes_between_two_points_of_open_ocean", () => {
        const r = seaRoute(...MID_ATLANTIC, -20, 45);
        expect(r).not.toBe(null);
        expect(r.length).toBeGreaterThan(0);
    });

    it("test_refuses_a_course_onto_dry_land_it_cannot_reach", () => {
        // A landlocked point has no navigable water near it, so no course exists.
        expect(seaRoute(...MID_ATLANTIC, 79.0, 43.0)).toBe(null); // central Kazakhstan
    });
});

describe("shared A* scratch", () => {
    it("test_repeated_and_interleaved_calls_return_identical_routes", () => {
        // The search reuses one set of grid-sized buffers across every call,
        // stamped per call rather than cleared. A stale cell leaking into the next
        // search would show up as a route that changes when another runs between.
        const a1 = JSON.stringify(landRoute(...MADRID, ...WARSAW));
        const s1 = JSON.stringify(seaRoute(...MID_ATLANTIC, -20, 45));
        for (let i = 0; i < 3; i++) {
            landRoute(...MADRID, ...CHICAGO); // a failing search between
            seaRoute(...MID_PACIFIC, ...MID_ATLANTIC); // and a long one
            expect(JSON.stringify(landRoute(...MADRID, ...WARSAW))).toBe(a1);
            expect(JSON.stringify(seaRoute(...MID_ATLANTIC, -20, 45))).toBe(s1);
        }
    });

    it("test_a_route_to_where_it_already_is_is_a_single_mark", () => {
        const r = landRoute(...MADRID, ...MADRID);
        expect(r).not.toBe(null);
        expect(r.length).toBe(1);
    });
});
