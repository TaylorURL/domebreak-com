import UnitIcon from "../common/UnitIcon.jsx";
import {WARHEADS} from "../../game/engine.js";
import {prodIcon, prodLabel, prodTime} from "../lib/prod.js";
import {fmtPct} from "../lib/format.js";

// Compact "3m 20s" / "45s" duration for the queue's total time-remaining readout.
function fmtDur(sec) {
    const s = Math.max(0, Math.round(sec));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
}

// The national production line, docked bottom-center over the map: the item on the
// line with live progress, then everything queued behind it. Hidden while idle.
//
// The queue is aggregated by unit type across the WHOLE line (not just adjacent
// runs), so a mixed build order of twenty different types reads as one tidy set of
// counted chips — "Fighter x4", "Tank x3" — that WRAPS onto multiple rows instead
// of running off in an endless horizontal scroll. Each chip cancels the last-queued
// instance of its type for a refund (LIFO); clicking the active item cancels it.
export default function ProductionBar({world, api, mySlot}) {
    const me = world.nations.find((n) => n.slot === mySlot);
    const cur = me?.prod?.current || null;
    const queue = me?.prod?.queue || [];
    if (!cur && queue.length === 0) return null;
    const label = (it) => prodLabel(it, me?.iso);
    const pct = cur ? fmtPct(cur.progress) : 0;
    // Seconds of work left on the item currently on the line (whole-second, at 1x
    // game speed) — a concrete countdown alongside the percentage.
    const eta = cur ? Math.max(0, Math.ceil(prodTime(cur.item) * (1 - cur.progress))) : 0;

    // Aggregate the queue by type across the whole line, preserving first-appearance
    // order. `lastIndex` is the newest instance of that type — cancelling removes it
    // (LIFO), so the rest of the order stays put.
    const groups = [];
    const byKey = new Map();
    queue.forEach((it, i) => {
        const key = `${it.kind}:${it.type}`;
        let g = byKey.get(key);
        if (!g) {
            g = {key, item: it, count: 0, lastIndex: i};
            byKey.set(key, g);
            groups.push(g);
        }
        g.count++;
        g.lastIndex = i;
    });

    // Total time still on the line: work left on the current item plus the full
    // build time of everything queued behind it.
    const totalLeft = eta + queue.reduce((sum, it) => sum + prodTime(it), 0);
    const queuedCount = queue.length;

    return (
        <div className="db-hud-panel relative pointer-events-auto flex flex-col min-w-[240px] max-w-[min(560px,72vw)] max-h-[42vh] [--db-tab:99px] motion-safe:animate-[dbPop_220ms_var(--ease-out)]">
            {/* Header: line label + a live summary of what's left to build. */}
            <header className="flex items-center gap-2 px-[11px] h-[26px] flex-none">
                <span>Production</span>
                {queuedCount > 0 && (
                    <span className="font-mono text-[9.5px] text-dim tabular-nums tracking-normal normal-case">
                        {queuedCount} queued
                    </span>
                )}
                <span
                    className="ml-auto font-mono text-[9.5px] text-faint tabular-nums tracking-normal normal-case"
                    title="Time remaining on the whole line"
                >
                    ~{fmtDur(totalLeft)} left
                </span>
            </header>

            <div className="db-scroll flex flex-col gap-[7px] overflow-y-auto px-[11px] pt-[9px] pb-[10px]">
                {/* Polite live region: re-announces only when the item on the line changes
                    identity, so a new build start is spoken without narrating every tick. */}
                <span className="sr-only" aria-live="polite">
                    {cur ? `Now building ${label(cur.item)}` : ""}
                </span>

                {/* Active item — the prominent progress row. The fill behind the label is
                    ticked by .db-seg, so the bar reads as counted progress rather than a
                    smear; the gaps are punched in the row's own surface. */}
                {cur && (
                    <button
                        className="db-notch-sm relative overflow-hidden flex items-center gap-[8px] w-full px-[10px] py-[8px] bg-btn-bg border border-gold-line text-text text-[12px] whitespace-nowrap cursor-pointer text-left transition-[border-color] duration-[var(--dur-fast)] ease-out-db hover:border-gold active:scale-[0.99] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]"
                        style={cur.item.kind === "ammo" ? {"--flame": WARHEADS[cur.item.type].flame} : undefined}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Building ${label(cur.item)}: ${pct}%, ${eta}s remaining. Click to cancel for a refund.`}
                        title={`${label(cur.item)} is building. Click to cancel for a refund.`}
                        onClick={() => api.cancelProd(-1)}
                    >
                        <span
                            className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out-db pointer-events-none"
                            style={{width: `${pct}%`}}
                            aria-hidden="true"
                        >
                            <i className="db-seg [--db-seg-gap:var(--btn-bg)] block h-full w-full bg-[var(--flame,var(--gold))] opacity-[0.26]" />
                        </span>
                        <UnitIcon name={prodIcon(cur.item)} size={16} className="relative z-1" />
                        <span className="relative z-1 flex-1 min-w-0 overflow-hidden text-ellipsis font-medium">
                            {label(cur.item)}
                        </span>
                        <b className="relative z-1 font-mono text-[11px] tabular-nums">{pct}%</b>
                        <span className="relative z-1 font-mono text-[10px] text-faint tabular-nums">{eta}s</span>
                    </button>
                )}

                {/* Queue — a wrapping grid of counted, per-type chips. */}
                {groups.length > 0 && (
                    <div className="flex flex-wrap gap-[6px]">
                        {groups.map((g) => (
                            <button
                                key={g.key}
                                className="db-notch-sm db-brackets group relative flex items-center gap-[6px] pl-[8px] pr-[7px] py-[6px] bg-btn-bg border border-line text-dim text-[11px] whitespace-nowrap cursor-pointer transition-[color,border-color] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:border-danger active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--gold)]"
                                style={g.item.kind === "ammo" ? {"--flame": WARHEADS[g.item.type].flame} : undefined}
                                title={
                                    g.count > 1
                                        ? `${label(g.item)} x${g.count} queued, ${prodTime(g.item)}s each. Click to cancel one for a refund.`
                                        : `${label(g.item)}, ${prodTime(g.item)}s on the line. Click to cancel for a refund.`
                                }
                                onClick={() => api.cancelProd(g.lastIndex)}
                            >
                                <UnitIcon name={prodIcon(g.item)} size={14} />
                                <span className="max-w-[120px] overflow-hidden text-ellipsis">{label(g.item)}</span>
                                {g.count > 1 && (
                                    <b className="flex-none font-mono text-[10px] leading-none px-[5px] py-[2px] bg-gold-soft text-gold tabular-nums">
                                        x{g.count}
                                    </b>
                                )}
                                {/* Cancel affordance: a subtle × that firms up on hover. */}
                                <span
                                    className="flex-none grid place-items-center w-[13px] h-[13px] -mr-[1px] text-danger text-[13px] leading-none opacity-0 transition-opacity duration-[var(--dur-fast)] ease-out-db group-hover:opacity-100"
                                    aria-hidden="true"
                                >
                                    &times;
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
