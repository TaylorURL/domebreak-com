// The political map tint shared by the live map (useOwnershipLayer, painted by
// MapLayers) and the menu attract sim (AttractSim). Both must paint nations
// identically: a country's fill says where the seat the map belongs to stands
// with it, a nation wiped out in war falls darker than anything else, and every
// country outside the roster is neutral scenery. These assertions lock that
// contract so the two callers can't silently drift apart.
import {describe, expect, it} from "vitest";
import {
    buildPoliticalTint,
    LINE,
    NEUTRAL_LINE,
    NEUTRAL_TINT,
    SOLID,
    standingInk,
    standingKey,
    TINT,
    WIPEOUT_LINE,
    WIPEOUT_TINT,
} from "../../../src/ui/lib/politicalTint.js";

// A roster in the shape the engine keeps it: slot 0 is the seat the map belongs
// to, and `relations` is that seat's standing toward everyone else.
const ROSTER = [
    {slot: 0, iso: "US", relations: {1: "war", 2: "ally", 3: "peace"}},
    {slot: 1, iso: "RU"},
    {slot: 2, iso: "FR"},
    {slot: 3, iso: "BR"},
];

// Pull the "match" pairs out of a MapLibre ["match", ["get","GID_0"], k,v,..., default]
// expression into a lookup, plus the trailing default.
function matchToMap(expr) {
    if (!Array.isArray(expr)) return {map: {}, dflt: expr};
    const body = expr.slice(2);
    const dflt = body[body.length - 1];
    const map = {};
    for (let i = 0; i + 1 < body.length - 1; i += 2) map[body[i]] = body[i + 1];
    return {map, dflt};
}

describe("politicalTint", () => {
    it("test_a_country_is_painted_by_where_you_stand_with_it", () => {
        const {tint} = buildPoliticalTint({nations: ROSTER, mySlot: 0});
        const {map, dflt} = matchToMap(tint);
        expect(map.USA).toBe(TINT.mine);
        expect(map.RUS).toBe(TINT.war);
        expect(map.FRA).toBe(TINT.ally);
        expect(map.BRA).toBe(TINT.peace);
        expect(dflt).toBe(NEUTRAL_TINT); // a country outside the roster is scenery
    });

    it("test_a_non_participant_is_scenery_whatever_the_roster_says", () => {
        const nations = [...ROSTER.slice(0, 3), {slot: 3, iso: "BR", active: false}];
        const {tint} = buildPoliticalTint({nations, mySlot: 0});
        expect(matchToMap(tint).map.BRA).toBe(TINT.neutral);
    });

    it("test_wiped_out_nations_fall_darker_than_their_standing", () => {
        const nations = [ROSTER[0], {slot: 1, iso: "RU", wipedOut: true}, ...ROSTER.slice(2)];
        const {tint, line} = buildPoliticalTint({nations, mySlot: 0});
        expect(matchToMap(tint).map.USA).toBe(TINT.mine); // still standing
        expect(matchToMap(tint).map.RUS).toBe(WIPEOUT_TINT); // routed, not its war red
        expect(matchToMap(line).map.RUS).toBe(WIPEOUT_LINE);
    });

    it("test_borders_take_the_same_standing_as_the_fill", () => {
        const {line} = buildPoliticalTint({nations: ROSTER, mySlot: 0});
        const {map, dflt} = matchToMap(line);
        expect(map.USA).toBe(LINE.mine);
        expect(map.RUS).toBe(LINE.war);
        expect(dflt).toBe(NEUTRAL_LINE);
    });

    it("test_an_empty_roster_falls_to_neutral_scenery", () => {
        const {tint, line} = buildPoliticalTint({});
        expect(tint).toBe(NEUTRAL_TINT);
        expect(line).toBe(NEUTRAL_LINE);
    });

    it("test_fully_conquered_country_wears_the_conquerors_standing_seamlessly", () => {
        // FRA fully taken by the seat's own nation: it renders exactly as that
        // nation's home land, so the annexed country merges seamlessly.
        const {tint, line} = buildPoliticalTint({
            nations: ROSTER,
            mySlot: 0,
            conquered: new Map([["FRA", "USA"]]),
        });
        const t = matchToMap(tint).map;
        const l = matchToMap(line).map;
        expect(t.FRA).toBe(TINT.mine); // the conqueror's standing, not its own ally blue
        expect(t.FRA).toBe(t.USA);
        expect(l.FRA).toBe(l.USA);
    });

    it("test_conquered_wins_over_the_roster_and_wiped_branches", () => {
        // A taken country is drawn once, as its conqueror — never doubled back to
        // its own standing, the neutral default, or the wipeout wash.
        const nations = [ROSTER[0], {slot: 1, iso: "RU", wipedOut: true}, ...ROSTER.slice(2)];
        const {tint} = buildPoliticalTint({nations, mySlot: 0, conquered: new Map([["RUS", "USA"]])});
        expect(matchToMap(tint).map.RUS).toBe(TINT.mine);
    });

    it("test_standingKey_and_standingInk_agree_with_the_tables", () => {
        const me = ROSTER[0];
        expect(standingKey(ROSTER[1], 0, me)).toBe("war");
        expect(standingInk(ROSTER[1], 0, me)).toBe(SOLID.war);
        expect(standingKey(ROSTER[0], 0, me)).toBe("mine");
        expect(standingInk(ROSTER[2], 0, me)).toBe(SOLID.ally);
        // No seat at all (a map with no roster behind it) reads everyone as at peace.
        expect(standingKey(ROSTER[1], undefined, undefined)).toBe("peace");
    });
});
