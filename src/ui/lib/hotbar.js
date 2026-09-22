// The eight command-deck slots, in key order. The keys 1-8 place the unit in the
// matching slot, and the Build drawer badges the same eight tiles with their key
// so the two surfaces read as one.
export const HOTBAR = [
    {type: "battery", short: "SAM"},
    {type: "patriot", short: "Patriot"},
    {type: "radar", short: "Radar"},
    {type: "factory", short: "Factory"},
    {type: "refinery", short: "Refinery"},
    {type: "bunker", short: "Bunker"},
    {type: "airstrip", short: "Airstrip"},
    {type: "silo", short: "Silo"},
];

// The 1-based key a unit type is bound to on the deck, or null when it has no
// slot. The Build drawer reads this to badge its tiles.
export function hotbarKeyOf(type) {
    const i = HOTBAR.findIndex((s) => s.type === type);
    return i < 0 ? null : i + 1;
}
