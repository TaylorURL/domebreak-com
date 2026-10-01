import {colorForSlot} from "../../game/data/constants.js";
import HudTooltip from "./HudTooltip.jsx";

// The player's bookmarked map points, listed under the objective tracker in the
// right-hand column. Clicking a row flies the camera there. Positioned by the
// column it sits in, so it never places itself. A name too long for the column
// is cut short, and only then does its row open a tooltip with the whole name,
// out to the left over the map rather than over the next pin.
export default function PinnedBar({pins, onGo, onRemove}) {
    if (!pins.length) return null;
    return (
        <div className="db-hud-panel relative w-[190px] pointer-events-auto">
            <header className="flex items-center px-[10px] h-[30px]">Pinned</header>
            <div className="px-[8px] py-[6px]">
                {pins.map((p) => (
                    <div key={p.key} className="flex items-center gap-1">
                        <HudTooltip label={p.label} side="left" truncatedOnly>
                            <button
                                className="flex-1 flex items-center gap-[7px] bg-transparent border border-transparent text-text text-left text-xs px-[5px] py-1 whitespace-nowrap overflow-hidden text-ellipsis transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-accent-soft hover:border-line-2 focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]"
                                onClick={() => onGo(p)}
                                aria-label={`Fly to ${p.label}`}
                            >
                                <span
                                    className="db-led"
                                    style={{color: p.color || colorForSlot(0)}}
                                    aria-hidden="true"
                                />
                                {p.label}
                            </button>
                        </HudTooltip>
                        <button
                            className="bg-transparent border-none text-faint text-sm px-1 py-0 transition-colors duration-[var(--dur-fast)] hover:text-danger"
                            onClick={() => onRemove(p.key)}
                            aria-label={`Remove pin ${p.label}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
