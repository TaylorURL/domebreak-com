import {cn} from "../lib/cn.js";
import Icon from "../common/Icon.jsx";

const LAYER_DEFS = [
    {id: "countries", label: "Countries", icon: "countries"},
    {id: "diplomacy", label: "Diplomacy", icon: "diplomacy-scale"},
    {id: "states", label: "State Borders", icon: "borders"},
    {id: "defense", label: "Defense Range", icon: "defense"},
    {id: "radar", label: "Radar Coverage", icon: "radar"},
    {id: "pop", label: "Population Heat", icon: "pop"},
    {id: "backdrop", label: "World Cities", icon: "cities"},
];
export default function LayerBar({layers, onToggle}) {
    return (
        <div
            className="db-hud-panel relative flex flex-row items-stretch gap-1 w-auto p-[6px] [--db-tab:0px]"
            role="group"
            aria-label="Map layers"
        >
            {LAYER_DEFS.map((l) => (
                <button
                    key={l.id}
                    className={cn(
                        "db-notch-sm relative flex flex-col items-center justify-start gap-1 w-[68px] px-[5px] py-[7px] text-center font-display text-[9px] tracking-[0.06em] border border-transparent text-dim transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-hair hover:text-text hover:border-line active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]",
                        layers[l.id] && "bg-gold-soft border-gold-line text-gold",
                    )}
                    aria-pressed={!!layers[l.id]}
                    aria-label={`${l.label} layer, ${layers[l.id] ? "on" : "off"}`}
                    onClick={() => onToggle(l.id)}
                >
                    <Icon name={l.icon} size={17} />
                    <span className="flex-none text-center leading-[1.2] whitespace-normal [word-break:normal] [overflow-wrap:break-word]">
                        {l.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
