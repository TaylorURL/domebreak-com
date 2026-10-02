// Render smoke for the six screens the dock's drawer mounts. Node-env: each one
// renders through react-dom/server against a synthetic world, which exercises
// the whole component (none of them run an effect on first paint), and asserts
// the structure the drawer contract names — the db-drawer-screen root, the
// header, the tab row, and the content each screen owes.
import {describe, expect, it} from "vitest";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createWorld} from "../../../src/game/engine.js";
import ProductionScreen from "../../../src/ui/screens/ProductionScreen.jsx";
import DiplomacyScreen from "../../../src/ui/screens/DiplomacyScreen.jsx";
import BattlePlanScreen from "../../../src/ui/screens/BattlePlanScreen.jsx";
import GoalsScreen from "../../../src/ui/screens/GoalsScreen.jsx";
import LogScreen from "../../../src/ui/screens/LogScreen.jsx";

function makeWorld() {
    const w = createWorld({
        mySlot: 0,
        seed: 3,
        nations: [
            {slot: 0, iso: "us", name: "United States"},
            {slot: 1, iso: "ru", name: "Russia"},
            {slot: 2, iso: "br", name: "Brazil"},
        ],
        cities: [
            {id: "us-0", slot: 0, name: "Washington", state: "DC", cap: true, pop: 5e6, econ: 0.3, lng: -77, lat: 38},
            {id: "ru-0", slot: 1, name: "Moscow", state: "", cap: true, pop: 12e6, econ: 0.5, lng: 37, lat: 55},
            {id: "br-0", slot: 2, name: "Brasilia", state: "", cap: true, pop: 3e6, econ: 0.2, lng: -47, lat: -15},
        ],
    });
    w.nations[0].relations[2] = "war";
    w.nations[2].relations[0] = "war";
    w.events.push({id: "e1", t: 40, type: "war", a: 2, b: 0});
    w.events.push({id: "e2", t: 42, type: "built", kind: "unit", slot: 1, unit: "battery"});
    w.events.push({id: "e3", t: 44, type: "destroy", kind: "city", cityId: "ru-0"});
    return w;
}

const api = new Proxy({}, {get: () => () => ({ok: true})});
const bp = {
    plans: [
        {
            id: "p1",
            name: "Opening",
            color: "#fff",
            attackerTypes: [],
            targetTypes: [],
            targetNations: [],
            engagementKm: 2000,
            mode: "standing",
            armed: false,
            overkill: false,
            autoBuild: false,
        },
    ],
    activeId: "p1",
    setActiveId: () => {},
    addPlan: () => {},
    patchPlan: () => {},
    renamePlan: () => {},
    setPlanMode: () => {},
    duplicatePlan: () => {},
    removePlan: () => {},
    executePlan: () => {},
    toggleAttackerType: () => {},
    toggleTargetType: () => {},
    toggleTargetNation: () => {},
    clearAttackerTypes: () => {},
    clearTargetTypes: () => {},
    clearTargetNations: () => {},
};
bp.active = bp.plans[0];

describe("drawer screens", () => {
    const w = makeWorld();
    const render = (C, props) => renderToStaticMarkup(React.createElement(C, props));

    it("build renders its tabs, tiles and queue", () => {
        const html = render(ProductionScreen, {
            world: w,
            api,
            mySlot: 0,
            placing: null,
            setPlacing: () => {},
            onClose: () => {},
        });
        expect(html).toContain("db-drawer-screen");
        expect(html).toContain("Build");
        expect(html).toContain("db-tabs");
        expect(html).toContain("db-tile");
        expect(html).toContain("Queue");
        expect(html).toContain("SAM Battery");
    });

    it("talks renders the war board and the roster", () => {
        const html = render(DiplomacyScreen, {
            world: w,
            api,
            mySlot: 0,
            online: false,
            players: null,
            onClose: () => {},
        });
        expect(html).toContain("War Board");
        expect(html).toContain("Brazil");
        expect(html).toContain("At War");
        expect(html).toContain("Declare War");
    });

    it("plan renders its sections", () => {
        const html = render(BattlePlanScreen, {world: w, mySlot: 0, bp, onClose: () => {}});
        expect(html).toContain("Attackers");
        expect(html).toContain("Target Nations");
        expect(html).toContain("Engagement Range");
        expect(html).toContain("Arm Plan");
    });

    it("goals renders active objectives and their tasks", () => {
        const html = render(GoalsScreen, {world: w, mySlot: 0, onClose: () => {}});
        expect(html).toContain("Goals");
        expect(html).toContain("Establish Command");
        expect(html).toContain("Queued");
    });

    it("log renders stamped rows newest first", () => {
        const html = render(LogScreen, {world: w, mySlot: 0, onFocus: () => {}, onClose: () => {}});
        expect(html).toContain("db-mark");
        expect(html).toContain("Strikes");
        const moscow = html.indexOf("Moscow");
        const war = html.indexOf("declares war");
        expect(moscow).toBeGreaterThan(-1);
        expect(war).toBeGreaterThan(moscow); // newest first
    });
});
