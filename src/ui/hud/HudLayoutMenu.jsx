import Icon from "../common/Icon.jsx";
import {HUD_PANELS} from "../../game/platform/hudLayout.js";
import {cn} from "../lib/cn.js";
import {useDisclosure} from "../../lib/hooks/useDisclosure.js";

// Always-visible HUD hub, docked bottom-left over the map. It's the reliable way
// back for anything the player has hidden or dragged astray: toggle each panel's
// visibility and reset the whole layout — reachable even when every adjustable
// panel is hidden. Complements the per-panel drag toolbars.
//
// `panels` defaults to the full set; the caller narrows it (e.g. dropping the
// online-only Comms panel in solo play) so the menu only lists panels that
// actually render.
export default function HudLayoutMenu({layout, onToggle, onResetAll, panels = HUD_PANELS}) {
    const {open, toggle} = useDisclosure(false);
    const hiddenCount = panels.filter((p) => layout[p.id]?.hidden).length;

    return (
        <div className="absolute bottom-4 left-4 z-6 pointer-events-auto">
            {open && (
                /* The panel is clipped to its notch, so the lift comes off this wrapper. */
                <div className="db-hud-lift absolute bottom-full left-0 mb-2">
                    <div
                        className="db-hud-panel db-hud-solid relative w-[224px] [--db-tab:88px] motion-safe:animate-[dbPop_120ms_var(--ease-out)]"
                        role="menu"
                        aria-label="HUD layout"
                    >
                        <header className="flex items-center px-3 h-[26px]">HUD Panels</header>
                        <div className="p-2">
                            {panels.map((p) => {
                                const hidden = !!layout[p.id]?.hidden;
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        role="menuitemcheckbox"
                                        aria-checked={!hidden}
                                        className="db-notch-sm flex items-center justify-between gap-2 w-full px-2 py-[7px] border border-transparent text-left text-[12px] text-dim transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-gold-soft hover:border-gold-line hover:text-gold focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]"
                                        onClick={() => onToggle(p.id, {hidden: !hidden})}
                                        title={hidden ? `Show ${p.label}` : `Hide ${p.label}`}
                                    >
                                        <span className={cn("truncate", hidden && "text-faint")}>{p.label}</span>
                                        {hidden ? (
                                            <Icon name="eye-off" size={14} className="flex-none text-faint" />
                                        ) : (
                                            <Icon name="eye" size={14} className="flex-none text-gold" />
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                className="db-notch-sm flex items-center gap-2 w-full mt-2 pt-[9px] px-2 py-[7px] border border-transparent border-t-hair text-left text-[12px] text-dim transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-gold-soft hover:border-gold-line hover:text-gold focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]"
                                onClick={() => onResetAll()}
                                title="Reset all HUD panels to default"
                            >
                                <Icon name="reset" size={13} className="flex-none" />
                                Reset Layout
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button
                type="button"
                className={cn(
                    "db-notch-sm db-brackets relative w-9 h-9 grid place-items-center border border-line bg-panel text-dim backdrop-blur-[8px] transition-[color,border-color] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:border-blue active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]",
                    open && "text-gold border-gold-line",
                )}
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="menu"
                title="Customize HUD layout"
                aria-label="Customize HUD layout"
            >
                <Icon name="sliders" size={16} />
                {hiddenCount > 0 && !open && (
                    <span
                        className="db-notch-sm absolute top-0 right-0 min-w-[14px] h-[14px] px-1 grid place-items-center bg-gold text-gold-contrast font-mono text-[9px] font-bold leading-none tabular-nums"
                        aria-label={`${hiddenCount} hidden`}
                    >
                        {hiddenCount}
                    </span>
                )}
            </button>
        </div>
    );
}
