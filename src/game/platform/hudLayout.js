// Per-player HUD layout: how each adjustable in-game panel has been moved,
// resized, faded, or hidden. Persisted machine-local over the same localStorage
// plus on-disk mirror path as settings (see localData.persistKey), so a player's
// arrangement survives across sessions and belongs to the game install rather
// than to any account.
import {createPersistedStore} from "../../lib/storage.js";
import {clamp} from "../../lib/math.js";

// The adjustable regions. Order drives the layout-menu listing.
export const HUD_PANELS = [
    {id: "sidebar", label: "Nation Panel"},
    {id: "topbar", label: "Command Bar"},
    {id: "objectives", label: "Objectives"},
    {id: "bottomRight", label: "Map & War Bar"},
    {id: "prodQueue", label: "Production Queue"},
    // Online-only: the match chat. Present in the layout store for everyone so a
    // saved arrangement is stable, but the layout menu only lists it in multiplayer
    // (see HudLayoutMenu's `panels` prop) since it doesn't render in solo play.
    {id: "comms", label: "Comms", online: true},
];

// Resize and opacity travel limits. The bounds are deliberately tight: a panel
// can never be shrunk to an unreadable sliver, blown up over the map, or faded
// to fully invisible. UI tuning, not gameplay balance.
export const HUD_SCALE_MIN = 0.7;
export const HUD_SCALE_MAX = 1.4;
export const HUD_OPACITY_MIN = 0.35;
export const HUD_OPACITY_MAX = 1;

// A panel at rest: full size, fully opaque, visible, and sitting where the HUD
// docks it. dx/dy are pixel offsets from that default docked position.
const PANEL_DEFAULT = {dx: 0, dy: 0, scale: 1, opacity: 1, hidden: false};

export const DEFAULT_HUD_LAYOUT = Object.fromEntries(HUD_PANELS.map((p) => [p.id, {...PANEL_DEFAULT}]));

// Coerce one persisted (or caller-supplied) panel blob back into valid bounds.
// Missing and non-finite fields fall back to the default, so a partial blob
// still resolves to a complete, in-bounds panel.
export function normalizePanel(p) {
    const s = {...PANEL_DEFAULT, ...(p || {})};
    return {
        dx: Number.isFinite(s.dx) ? s.dx : 0,
        dy: Number.isFinite(s.dy) ? s.dy : 0,
        scale: clamp(Number.isFinite(s.scale) ? s.scale : 1, HUD_SCALE_MIN, HUD_SCALE_MAX),
        opacity: clamp(Number.isFinite(s.opacity) ? s.opacity : 1, HUD_OPACITY_MIN, HUD_OPACITY_MAX),
        hidden: !!s.hidden,
    };
}

// Every known panel is always present and in-bounds after load. Corrupt or
// missing blobs fall back to defaults automatically.
const store = createPersistedStore("domebreak.hudLayout", DEFAULT_HUD_LAYOUT, {
    normalize: (saved) => {
        const out = {};
        for (const p of HUD_PANELS) out[p.id] = normalizePanel(saved?.[p.id]);
        return out;
    },
});

export const loadHudLayout = store.load;
export const saveHudLayout = store.save;
