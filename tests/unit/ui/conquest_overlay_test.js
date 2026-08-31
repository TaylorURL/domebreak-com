// Ownership overlay logic (src/ui/lib/politicalTint.js — conquestOverlay), the
// pure core behind the political map's captured-territory recolor. Pins that
// captured land wears its conqueror's flag while that power is standing, and that
// it is handed straight back the moment the conqueror leaves the match — the case
// where a destroyed nation's color would otherwise outlive it, because the cities
// it took keep its slot forever. Pure, so it is asserted directly.
import {describe, expect, it} from "vitest";
import {conquestOverlay} from "../../../src/ui/lib/politicalTint.js";

// Two provinces of FRA plus one of USA. Slot 0 is the USA, slot 1 is France
// (nations carry ISO-2 codes; toGid3 maps them to the GADM GID_0);
// `fraSlot` is who holds the French cities, so the same theatre covers peacetime,
// conquest, and the conqueror's fall.
function theatre({fraSlot = 1, nations} = {}) {
    return {
        cities: [
            {id: "u1", slot: 0, pop: 100, alive: true},
            {id: "f1", slot: fraSlot, pop: 100, alive: true},
            {id: "f2", slot: fraSlot, pop: 80, alive: true},
        ],
        nations: nations ?? [
            {slot: 0, iso: "US", alive: true},
            {slot: 1, iso: "FR", alive: true},
        ],
        cityRegion: {u1: "USA.1_1", f1: "FRA.1_1", f2: "FRA.2_1"},
        flags: {USA: "rgb(1,2,3)", FRA: "rgb(4,5,6)"},
    };
}

describe("conquestOverlay", () => {
    it("test_leaves_native_territory_alone", () => {
        const {pairs, lineIds, conquered} = conquestOverlay(theatre());
        expect(pairs).toEqual([]);
        expect(lineIds).toEqual([]);
        expect(conquered.size).toBe(0);
    });

    it("test_hands_a_wholly_taken_country_to_the_base_tint_in_the_conquerors_flag", () => {
        // Every French city now flies slot 0 — the whole country is annexed, so it
        // goes to the base tint rather than the per-province overlay.
        const {pairs, conquered} = conquestOverlay(theatre({fraSlot: 0}));
        expect(conquered.get("FRA")).toBe("USA");
        expect(pairs).toEqual([]);
    });

    it("test_recolors_a_single_captured_province_in_the_conquerors_color", () => {
        const t = theatre();
        t.cities[1].slot = 0; // only FRA.1_1 falls; FRA.2_1 holds out
        const {pairs, lineIds, conquered} = conquestOverlay(t);
        expect(conquered.size).toBe(0); // not the whole country
        expect(pairs).toEqual(["FRA.1_1", "rgb(1,2,3)"]);
        expect(lineIds).toEqual(["FRA.1_1"]);
    });

    it("test_gives_a_province_back_when_its_conqueror_is_eliminated", () => {
        const t = theatre();
        t.cities[1].slot = 0;
        t.nations = [
            {slot: 0, iso: "US", alive: false},
            {slot: 1, iso: "FR", alive: true},
        ];
        const {pairs, lineIds} = conquestOverlay(t);
        // The captured province drops out of the overlay entirely, so the base tint
        // paints it back to what it was.
        expect(pairs).toEqual([]);
        expect(lineIds).toEqual([]);
    });

    it("test_gives_a_whole_annexed_country_back_when_its_conqueror_is_wiped_out", () => {
        const t = theatre({fraSlot: 0});
        t.nations = [
            {slot: 0, iso: "US", alive: true, active: false},
            {slot: 1, iso: "FR", alive: true},
        ];
        const {pairs, conquered} = conquestOverlay(t);
        expect(conquered.size).toBe(0);
        expect(pairs).toEqual([]);
    });

    it("test_a_dead_conquerors_fall_does_not_disturb_land_still_held_by_the_living", () => {
        // Slot 2 also took a French province; slot 0 is gone but slot 2 stands.
        const t = theatre();
        t.cities[1].slot = 0;
        t.cities[2].slot = 2;
        t.nations = [
            {slot: 0, iso: "US", alive: false},
            {slot: 1, iso: "FR", alive: true},
            {slot: 2, iso: "CN", alive: true},
        ];
        t.flags.CHN = "rgb(7,8,9)";
        const {pairs} = conquestOverlay(t);
        expect(pairs).toEqual(["FRA.2_1", "rgb(7,8,9)"]);
    });
});
