import {useMemo, useState} from "react";
import {
    gdpOf,
    hasSurrendered,
    industryCapOf,
    industryCountOf,
    industryOutputOf,
    industryPendingOf,
    netIncomeOf,
    populationOf,
    populationTrendOf,
    vitalityOf,
} from "../../game/engine.js";
import {fmtGdp, fmtNet, fmtPop} from "../lib/format.js";
import {DrawerScreen} from "../screens/ScreenFrame.jsx";
import Icon from "../common/Icon.jsx";
import Meter from "../common/Meter.jsx";
import PopTrend from "../common/PopTrend.jsx";
import {input} from "../lib/variants.js";
import {cn} from "../lib/cn.js";

// A territory's readiness band from its city vitality (hp share). Drives the
// status pill and its lamp; a dead holding reads "Lost".
function statusOf(c) {
    if (!c.alive) return {key: "lost", label: "Lost"};
    const v = vitalityOf(c);
    if (v >= 0.85) return {key: "secure", label: "Secure"};
    if (v >= 0.5) return {key: "strained", label: "Strained"};
    return {key: "critical", label: "Critical"};
}

// One figure in the strip under the header.
function Stat({label, value}) {
    return (
        <div className="flex flex-col gap-[3px] min-w-0 px-3 py-[9px] border-r border-b border-line [&:nth-child(2n)]:border-r-0">
            <span className="font-mono tabular-nums text-[14px] font-semibold leading-none text-text inline-flex items-center gap-1">
                {value}
            </span>
            <span className="text-[10px] leading-none text-faint truncate">{label}</span>
        </div>
    );
}

// Nation — your own nation in the dock's drawer: population, GDP, industry
// (living structures against the pop-driven ceiling) and net points over a
// live, searchable roster of every state you hold and its current status.
// Reads engine queries only; never mutates. Clicking a territory flies the
// camera to it.
export default function NationPanel({world, mySlot, myNation, onFocus, onClose}) {
    const [q, setQ] = useState("");

    // Recomputed each tick (world.time advances) so population, vitality and the
    // territory roster stay live as cities take damage or fall.
    const view = useMemo(() => {
        const mine = world.cities.filter((c) => c.slot === mySlot);
        const living = mine.filter((c) => c.alive);
        // Living holdings first, biggest population at top; lost ones sink below.
        const rows = [...mine].sort((a, b) => {
            if (a.alive !== b.alive) return a.alive ? -1 : 1;
            return (b.pop || 0) * vitalityOf(b) - (a.pop || 0) * vitalityOf(a);
        });
        // Owner standing gates the per-city "rebuilding" caret, matching healCities.
        const me = world.nations.find((n) => n.slot === mySlot);
        return {
            rows,
            heldCount: living.length,
            totalCount: mine.length,
            standing: !!me && me.alive && !hasSurrendered(world, me),
            pop: populationOf(world, mySlot),
            popRate: populationTrendOf(world, mySlot),
            gdp: gdpOf(world, mySlot),
            net: netIncomeOf(world, mySlot),
            indCount: industryCountOf(world, mySlot),
            indPending: industryPendingOf(world, mySlot),
            indCap: industryCapOf(world, mySlot),
            indOut: industryOutputOf(world, mySlot),
        };
        // world is mutated in place (stable ref), so key off world.time — it
        // advances every tick — to keep this recompute live, matching every other
        // world-derived memo. Without it the memo would freeze at first-mount
        // values, drifting from the live HUD and player list.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- world read inside; world.time is the tick clock we intend to key on
    }, [world, world.time, mySlot]);

    if (!myNation) return null;
    const indUsed = view.indCount + view.indPending;
    const indFrac = view.indCap > 0 ? Math.min(1, indUsed / view.indCap) : 0;
    const needle = q.trim().toLowerCase();
    const rows = needle
        ? view.rows.filter(
              (c) => c.name.toLowerCase().includes(needle) || (c.state || "").toLowerCase().includes(needle),
          )
        : view.rows;

    // Status lamp per readiness band, so a roster row states its condition twice:
    // once as a lit dot a glance catches, once as the word behind it.
    const pillTone = {
        secure: "text-dim",
        strained: "text-dim",
        critical: "text-red",
        lost: "text-faint",
    };
    const pillLed = {
        secure: "db-led-ok",
        strained: "db-led-warn",
        critical: "db-led-live",
        lost: "text-faint",
    };

    return (
        <DrawerScreen
            title={myNation.name}
            labelledBy="db-drawer-nation"
            caption={
                <>
                    <b>{view.heldCount}</b> of <b>{view.totalCount}</b> territories
                </>
            }
            onClose={onClose}
        >
            <div className="grid grid-cols-2">
                <Stat
                    label="Population"
                    value={
                        <>
                            {fmtPop(view.pop)}
                            <PopTrend rate={view.popRate} base={view.pop} className="text-[11px]" />
                        </>
                    }
                />
                <Stat label="GDP" value={fmtGdp(view.gdp)} />
                <Stat label="Net" value={`${fmtNet(view.net, 1)}/s`} />
                <Stat label="Territories" value={`${view.heldCount}/${view.totalCount}`} />
            </div>

            <div
                className="px-4 py-[11px] border-b border-line"
                title={`${view.indCount} standing${view.indPending ? ` + ${view.indPending} in production` : ""} of ${view.indCap} industry slots (factories, ports, refineries, tech parks). The cap grows with population. Combined output +${view.indOut.toFixed(1)} pts/s.`}
            >
                <div className="flex items-baseline justify-between gap-2 mb-[7px]">
                    <span className="db-sec">Industry (used / cap)</span>
                    <span className="font-mono text-[11px] tabular-nums text-dim whitespace-nowrap">
                        {indUsed}
                        <span className="text-faint">/{view.indCap}</span> · +{view.indOut.toFixed(1)}/s
                    </span>
                </div>
                <Meter frac={indFrac} ariaLabel="Industry slots used" />
            </div>

            <div className="px-4 pt-3 pb-1">
                <input
                    className={cn(input(), "px-3 py-2 text-[12.5px]")}
                    placeholder="Search territories"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search territories"
                />
            </div>

            <div className="px-2 pb-3">
                {rows.map((c) => {
                    const st = statusOf(c);
                    const v = vitalityOf(c);
                    return (
                        <button
                            key={c.id}
                            className={cn(
                                "flex items-center justify-between gap-2 w-full px-2 py-[8px] border border-transparent text-left transition-[background-color,border-color] duration-[var(--dur-fast)] ease-out-db hover:bg-accent-soft hover:border-line-2",
                                !c.alive && "opacity-55",
                            )}
                            onClick={() => onFocus?.(c)}
                            title={`Focus ${c.name}`}
                        >
                            <span className="flex flex-col leading-[1.25] min-w-0">
                                <span className="flex items-center gap-1 text-[12.5px] text-text min-w-0">
                                    {!!c.cap && (
                                        <Icon name="star" size={10} className="text-text flex-none" title="Capital" />
                                    )}
                                    <span className="truncate">{c.name}</span>
                                </span>
                                {c.state && <span className="text-[10px] text-faint truncate">{c.state}</span>}
                            </span>
                            <span className="flex items-center gap-[10px] flex-none">
                                <span className="font-mono text-[11px] tabular-nums text-dim inline-flex items-center gap-[3px]">
                                    {c.alive ? fmtPop((c.pop || 0) * v) : "—"}
                                    {c.alive && view.standing && (c.pop || 0) > 0 && c.hp < c.maxHp && (
                                        <PopTrend
                                            up
                                            title="Rebuilding: population recovers as the city heals"
                                            className="text-[9px]"
                                        />
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        "inline-flex items-center gap-[5px] w-[76px] text-[10.5px] px-[6px] py-[2px] border border-line",
                                        pillTone[st.key],
                                    )}
                                >
                                    <span className={cn("db-led", pillLed[st.key])} aria-hidden="true" />
                                    {st.label}
                                </span>
                            </span>
                        </button>
                    );
                })}
                {rows.length === 0 && (
                    <div className="px-3 py-3 text-center text-faint text-[12px]">
                        {view.rows.length === 0 ? "No territories held." : "No territory matches that."}
                    </div>
                )}
            </div>
        </DrawerScreen>
    );
}
