import Icon from "../common/Icon.jsx";
import {cn} from "../lib/cn.js";

// Every overlay the map can wear, in the order the row reads. The label is the
// tooltip; the glyph is the whole control.
const LAYERS = [
    {id: "countries", label: "Country Fill", icon: "map"},
    {id: "diplomacy", label: "Standings", icon: "diplomacy-scale"},
    {id: "states", label: "State Borders", icon: "border"},
    {id: "defense", label: "Defense Range", icon: "range"},
    {id: "radar", label: "Radar Coverage", icon: "radar"},
    {id: "pop", label: "Population Heat", icon: "heat"},
    {id: "backdrop", label: "World Cities", icon: "cities"},
];

const BTN =
    "grid place-items-center w-10 h-[34px] text-dim transition-[color,background-color] duration-[var(--dur-fast)] ease-out-db hover:text-text focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]";
const ON = "bg-accent-soft text-accent shadow-[inset_0_-2px_0_var(--accent)]";

// The layer row, bottom right: what the map draws over the world, and whether it
// is drawn on a globe or flat.
export default function LayerToggles({layers, onToggle, globe, onGlobe}) {
    return (
        <div
            className="db-hud-panel relative flex items-center h-11 px-1.5 gap-0.5 pointer-events-auto"
            role="group"
            aria-label="Map layers"
        >
            {LAYERS.map((l) => (
                <button
                    type="button"
                    key={l.id}
                    className={cn(BTN, layers[l.id] && ON)}
                    aria-pressed={!!layers[l.id]}
                    aria-label={`${l.label} layer, ${layers[l.id] ? "on" : "off"}`}
                    title={l.label}
                    onClick={() => onToggle(l.id)}
                >
                    <Icon name={l.icon} size={18} />
                </button>
            ))}
            {onGlobe && (
                <>
                    <span className="w-px h-6 mx-1 bg-line" aria-hidden="true" />
                    <button
                        type="button"
                        className={cn(BTN, globe && ON)}
                        aria-pressed={!!globe}
                        aria-label={globe ? "Globe view, on" : "Globe view, off"}
                        title="Globe View"
                        onClick={onGlobe}
                    >
                        <Icon name="globe" size={18} />
                    </button>
                </>
            )}
        </div>
    );
}
