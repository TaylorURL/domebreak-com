import {UNIT_ICON, unitLabel, unitLockReason, WARHEAD_ORDER, WARHEADS} from "../../game/engine.js";
import {WARHEAD_ICON} from "../../game/data/constants.js";
import UnitIcon from "../common/UnitIcon.jsx";
import {prodLabel, prodTime} from "../lib/prod.js";
import {cn} from "../lib/cn.js";
import {HOTBAR} from "../lib/hotbar.js";

// One stockpile cell: the round, how many are held, and what it is called. A
// stockpile of none drops to the faint ink so a glance skips it.
function Round({type, count}) {
    const wh = WARHEADS[type];
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-[3px] w-[54px] max-[1439px]:w-[44px] h-[72px]",
                count > 0 ? "text-accent" : "text-faint",
            )}
            title={`${wh.name} in the stockpile: ${count}`}
            role="img"
            aria-label={`${wh.name}: ${count} held`}
        >
            <UnitIcon name={WARHEAD_ICON[type]} size={24} />
            <b
                className={cn(
                    "font-mono text-[17px] font-semibold tabular-nums leading-none",
                    count === 0 && "text-faint",
                )}
            >
                {count}
            </b>
            <small className="text-[10px] leading-none text-faint max-[1439px]:hidden">{wh.short}</small>
        </div>
    );
}

// The command deck: the national stockpile, the build hotbar keyed 1-8, and what
// the line is turning out right now.
export default function CommandDeck({world, mySlot, myNation, placing, onPlace}) {
    const ammo = myNation?.ammo || {};
    const cur = myNation?.prod?.current || null;
    const queue = myNation?.prod?.queue || [];
    const eta = cur ? Math.max(0, Math.ceil(prodTime(cur.item) * (1 - cur.progress))) : 0;

    return (
        <div
            className="db-hud-panel relative flex items-stretch w-full h-[96px] pointer-events-auto"
            role="group"
            aria-label="Command deck"
        >
            <div
                className="flex items-center gap-[6px] max-[1439px]:gap-[4px] px-[14px] max-[1439px]:px-[12px] border-r border-line"
                role="group"
                aria-label="Warhead stockpile"
            >
                {WARHEAD_ORDER.map((t) => (
                    <Round key={t} type={t} count={ammo[t] ?? 0} />
                ))}
            </div>

            <div
                className="flex-1 min-w-0 flex items-center gap-[6px] px-[14px]"
                role="group"
                aria-label="Build hotbar"
            >
                {HOTBAR.map((s, i) => {
                    const lock = unitLockReason(world, mySlot, s.type);
                    const on = placing === s.type;
                    const building = cur?.item.kind === "unit" && cur.item.type === s.type;
                    const label = unitLabel(s.type);
                    return (
                        <button
                            type="button"
                            key={s.type}
                            className={cn(
                                "relative flex-1 min-w-[48px] max-w-[70px] h-[72px] flex flex-col items-center justify-center gap-[5px] border text-dim transition-[border-color,color,background-color] duration-[var(--dur-fast)] ease-out-db focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--accent)]",
                                on
                                    ? "border-accent bg-accent-soft text-accent"
                                    : "border-line hover:border-line-2 hover:text-text",
                                lock && "opacity-40",
                            )}
                            onClick={() => onPlace?.(s.type)}
                            aria-pressed={on}
                            title={lock ? `${label}: ${lock}` : `${label} (${i + 1})`}
                            aria-label={lock ? `${label}, locked: ${lock}` : `Place a ${label}, key ${i + 1}`}
                        >
                            <span
                                className="absolute left-[5px] top-[5px] inline-grid place-items-center min-w-[14px] h-[14px] px-[3px] border border-line-2 font-mono text-[9px] leading-none text-faint"
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <UnitIcon name={UNIT_ICON[s.type]} size={24} />
                            <small className={cn("text-[10px] font-medium leading-none truncate max-w-full px-1")}>
                                {s.short}
                            </small>
                            {building && (
                                <i
                                    className="absolute left-[6px] right-[6px] bottom-[5px] h-[2px] bg-line"
                                    aria-hidden="true"
                                >
                                    <i
                                        className="block h-full bg-accent"
                                        style={{width: `${Math.round((cur.progress || 0) * 100)}%`}}
                                    />
                                </i>
                            )}
                        </button>
                    );
                })}
            </div>

            <div
                className="flex flex-col justify-center gap-1 px-4 w-[132px] border-l border-line text-[11px] text-faint max-[1599px]:hidden"
                aria-live="polite"
            >
                <span>Building</span>
                <b className="truncate text-[13px] font-semibold text-text">
                    {cur ? `${prodLabel(cur.item, myNation?.iso)} · ${eta}s` : "Idle"}
                </b>
                <span className="truncate text-dim">
                    {queue.length ? `${queue.length} in queue` : "Nothing queued"}
                </span>
            </div>
        </div>
    );
}
