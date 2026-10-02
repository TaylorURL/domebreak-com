import Icon from "../common/Icon.jsx";
import HudTooltip from "./HudTooltip.jsx";
import {HUD_PANELS} from "../../game/platform/hudLayout.js";
import {cn} from "../lib/cn.js";
import {useDisclosure} from "../../lib/hooks/useDisclosure.js";

// The HUD hub, docked in the bottom-right corner beside the layer row. It's the
// reliable way back for anything the player has hidden or dragged astray: toggle
// each panel's visibility and reset the whole layout, reachable even when every
// adjustable panel is hidden. Complements the per-panel drag toolbars.
//
// `panels` defaults to the full set; the caller narrows it (e.g. dropping the
// online-only Comms panel in solo play) so the menu only lists panels that
// actually render.
const ROW =
    "flex items-center justify-between gap-2 w-full px-2 py-[7px] border border-transparent text-left text-[12px] text-dim transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-accent-soft hover:border-line-2 hover:text-text focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]";

export default function HudLayoutMenu({layout, onToggle, onResetAll, panels = HUD_PANELS}) {
    const {open, toggle} = useDisclosure(false);
    const hiddenCount = panels.filter((p) => layout[p.id]?.hidden).length;

    return (
        <div className="relative pointer-events-auto">
            {open && (
                <div
                    className="db-hud-panel db-hud-solid absolute bottom-full right-0 mb-2 w-[224px] motion-safe:animate-[dbPop_120ms_var(--ease-out)]"
                    role="menu"
                    aria-label="HUD layout"
                >
                    <header className="flex items-center px-3 h-[30px]">HUD Panels</header>
                    <div className="p-2">
                        {panels.map((p) => {
                            const hidden = !!layout[p.id]?.hidden;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    role="menuitemcheckbox"
                                    aria-checked={!hidden}
                                    className={ROW}
                                    onClick={() => onToggle(p.id, {hidden: !hidden})}
                                    title={hidden ? `Show ${p.label}` : `Hide ${p.label}`}
                                >
                                    <span className={cn("truncate", hidden && "text-faint")}>{p.label}</span>
                                    <Icon
                                        name={hidden ? "eye-off" : "eye"}
                                        size={14}
                                        className={cn("flex-none", hidden ? "text-faint" : "text-accent")}
                                    />
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            className={cn(ROW, "justify-start gap-2 mt-2 pt-[9px] border-t-hair")}
                            onClick={() => onResetAll()}
                            title="Reset every HUD panel to where it docks"
                        >
                            <Icon name="reset" size={13} className="flex-none" />
                            Reset Layout
                        </button>
                    </div>
                </div>
            )}
            {/* The tooltip stands down while the menu is open: both rise from
                this button, and the menu is the one being read. */}
            <HudTooltip label="Customize HUD Layout" disabled={open}>
                <button
                    type="button"
                    className={cn(
                        "relative grid place-items-center w-9 h-9 border border-line bg-panel text-dim backdrop-blur-[8px] transition-[color,border-color] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:border-line-2 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]",
                        open && "text-accent border-line-2",
                    )}
                    onClick={toggle}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    aria-label="Customize HUD layout"
                >
                    <Icon name="sliders" size={16} />
                    {hiddenCount > 0 && !open && (
                        <span
                            className="absolute -top-px -right-px min-w-[14px] h-[14px] px-1 grid place-items-center bg-accent-fill text-accent-ink font-mono text-[9px] font-semibold leading-none tabular-nums"
                            aria-label={`${hiddenCount} hidden`}
                        >
                            {hiddenCount}
                        </span>
                    )}
                </button>
            </HudTooltip>
        </div>
    );
}
