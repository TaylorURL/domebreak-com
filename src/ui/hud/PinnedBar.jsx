import {colorForSlot} from "../../game/data/constants.js";

export default function PinnedBar({pins, onGo, onRemove}) {
    if (!pins.length) return null;
    return (
        <div className="db-hud-panel absolute top-[88px] right-4 z-5 w-[190px] [--db-tab:62px]">
            <header className="flex items-center px-[10px] h-[26px]">Pinned</header>
            <div className="px-[8px] py-[6px]">
                {pins.map((p) => (
                    <div key={p.key} className="flex items-center gap-1">
                        <button
                            className="db-notch-sm flex-1 flex items-center gap-[7px] bg-transparent border border-transparent text-text text-left text-xs px-[5px] py-1 whitespace-nowrap overflow-hidden text-ellipsis transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-gold-soft hover:border-gold-line hover:text-gold focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]"
                            onClick={() => onGo(p)}
                            title="Fly To"
                            aria-label={`Fly to ${p.label}`}
                        >
                            <span className="db-led" style={{color: p.color || colorForSlot(0)}} aria-hidden="true" />
                            {p.label}
                        </button>
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
