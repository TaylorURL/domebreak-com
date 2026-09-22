import Icon from "../common/Icon.jsx";
import {keyLabel, resolveKeys} from "../../game/platform/keybindings.js";
import {cn} from "../lib/cn.js";

// The dock, top to bottom. `id` is both the drawer it opens and the rebindable
// action that opens it (see KEY_ACTIONS), so the key badge and the hotkey are the
// same lookup.
const DOCK_ITEMS = [
    {id: "production", label: "Build", icon: "factory"},
    {id: "battle", label: "Plan", icon: "target"},
    {id: "diplomacy", label: "Talks", icon: "flag"},
    {id: "nation", label: "Nation", icon: "city"},
    {id: "goals", label: "Goals", icon: "shield"},
    {id: "log", label: "Log", icon: "book"},
];

const ITEM =
    "relative w-[60px] h-[64px] flex flex-col items-center justify-center gap-[5px] text-[10px] font-medium text-dim transition-[color,background-color] duration-[var(--dur-fast)] ease-out-db hover:text-text focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]";
const BADGE =
    "absolute right-1 top-1 inline-grid place-items-center min-w-[14px] h-[14px] px-[3px] border border-line-2 font-mono text-[9px] leading-none text-faint";

// The left dock: the whole command surface in six items, plus the pause menu at
// the foot. Whichever item is active carries the wash and the white inset rule
// on its leading edge, and its drawer is the one open beside it.
export default function Dock({panel, keys, onPanel, onPause}) {
    const K = resolveKeys(keys);
    return (
        <nav
            className="absolute left-0 top-[52px] bottom-0 z-7 w-[72px] flex flex-col items-center gap-1 py-[10px] bg-panel-2 border-r border-line pointer-events-auto"
            aria-label="Command"
        >
            {DOCK_ITEMS.map((it) => {
                const on = panel === it.id;
                return (
                    <button
                        type="button"
                        key={it.id}
                        className={cn(ITEM, on && "bg-accent-soft text-accent shadow-[inset_2px_0_0_var(--accent)]")}
                        onClick={() => onPanel?.(it.id)}
                        aria-pressed={on}
                        title={K[it.id] ? `${it.label} (${keyLabel(K[it.id])})` : it.label}
                    >
                        {K[it.id] && (
                            <span className={BADGE} aria-hidden="true">
                                {keyLabel(K[it.id])}
                            </span>
                        )}
                        <Icon name={it.icon} size={22} />
                        {it.label}
                    </button>
                );
            })}
            <button
                type="button"
                className={cn(ITEM, "mt-auto")}
                onClick={() => onPause?.()}
                title="Settings (Esc)"
                aria-label="Open the pause menu"
            >
                <Icon name="gear" size={22} />
                Settings
            </button>
        </nav>
    );
}
