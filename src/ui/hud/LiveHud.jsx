import {useLayoutEffect, useRef, useState} from "react";
import {
    gdpOf,
    industryOutputOf,
    leadershipStatus,
    netIncomeOf,
    populationOf,
    populationTrendOf,
    stabilityBreakdown,
    stabilityStatus,
} from "../../game/engine.js";
import {GAME_SPEEDS} from "../../game/data/constants.js";
import {keyLabel, resolveKeys} from "../../game/platform/keybindings.js";
import {fmtGdp, fmtNet, fmtPop} from "../lib/format.js";
import {cn} from "../lib/cn.js";
import {clamp} from "../../lib/math.js";
import AmmoBar from "./AmmoBar.jsx";
import Icon from "../common/Icon.jsx";
import Meter from "../common/Meter.jsx";
import PopTrend from "../common/PopTrend.jsx";
import {iconButton, popoverCard} from "../lib/variants.js";
import {vitColor} from "../lib/status.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEC_PER_GS = 1800; // 30 in-game minutes per game-second

function gameDate(t) {
    const d = new Date(Date.UTC(2026, 0, 1) + t * SEC_PER_GS * 1000);
    return {
        date: `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`,
        time: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
    };
}

function leadSub(lead) {
    if (!lead) return "";
    if (lead.exposed && lead.atWar) return lead.evac ? "Evacuating" : "Exposed";
    if (lead.inTransit > 0) return "Evacuating";
    if (lead.sheltered > 0) return "Sheltered";
    return "Secure";
}

// Stability shares Leadership's traffic-light palette, with a one-word mood.
function stabSub(stab) {
    if (!stab) return "";
    if (stab.pct >= 67) return "Stable";
    if (stab.pct >= 34) return "Strained";
    return "Unrest";
}

// A vitality percentage → the lamp that annotates it. The healthy band is a
// steady green, the middle band a steady amber, and only the bottom band blinks:
// a light that flashes has to mean something is happening right now.
function vitLed(pct) {
    if (pct == null) return null;
    if (pct >= 67) return "db-led-ok";
    if (pct >= 34) return "db-led-warn";
    return "db-led-live";
}

// The command screens the top bar switches between, in display order.
const NAV = [
    {id: "production", label: "Production", icon: "production"},
    {id: "battle", label: "Battle Plan", icon: "battle-plan"},
    {id: "diplomacy", label: "Diplomacy", icon: "diplomacy"},
];

// The instrument type of the telemetry row, shared by every cell so the labels,
// figures and sub-lines line up across the bar however wide it runs.
const KICKER = "font-mono text-[9px] uppercase tracking-[0.16em] text-faint leading-[13px]";
const FIGURE = "font-mono text-[13px] font-semibold tabular-nums leading-[17px]";
const SUBLINE = "font-mono text-[9.5px] text-dim leading-[13px]";

// A hairline between two telemetry cells. Fixed height rather than self-stretch,
// so the rule reads as an instrument divider instead of a panel edge.
function Divider() {
    return <div className="w-px h-[34px] self-center bg-line-soft" aria-hidden="true" />;
}

// One right-aligned telemetry cell: a mono kicker with an optional status lamp,
// the figure beneath it, and then either a sub-line or a segmented meter. The
// two cells that open a breakdown on hover pass their own handlers and popover
// through `children`, so every cell is still built the same way.
function Cell({label, led, value, valueColor, sub, meter, meterColor, className, children, ...rest}) {
    return (
        <div className={cn("relative flex flex-col items-end leading-none", className)} {...rest}>
            <span className={cn(KICKER, "flex items-center gap-[6px]")}>
                {label}
                {led && <span className={cn("db-led", led)} aria-hidden="true" />}
            </span>
            <span className={cn(FIGURE, "mt-[2px]")} style={valueColor ? {color: valueColor} : undefined}>
                {value}
            </span>
            {sub}
            {meter != null && (
                <Meter
                    frac={meter}
                    className="mt-[3px] h-[4px] w-[74px] bg-line-soft [--db-seg-gap:var(--sunk)]"
                    color={meterColor}
                    ariaLabel={`${label} level`}
                />
            )}
            {children}
        </div>
    );
}

export default function LiveHud({
    world,
    api,
    myNation,
    panel,
    onPanel,
    keys,
    online,
    globe,
    onGlobe,
    onHelp,
    onMenu,
    meBadge,
}) {
    const K = resolveKeys(keys);
    const net = myNation ? netIncomeOf(world, myNation.slot) : 0;
    const pop = myNation ? populationOf(world, myNation.slot) : 0;
    const popRate = myNation ? populationTrendOf(world, myNation.slot) : 0;
    const gdp = myNation ? gdpOf(world, myNation.slot) : 0;
    const ind = myNation ? industryOutputOf(world, myNation.slot) : 0;
    const lead = myNation ? leadershipStatus(world, myNation.slot) : null;
    const stab = myNation ? stabilityStatus(world, myNation.slot) : null;
    const stabInfo = myNation ? stabilityBreakdown(world, myNation.slot) : null;
    const rivals = world.nations.filter((n) => n.alive && n.active !== false).length;
    const {date, time} = gameDate(world.time);

    // Which telemetry cell is showing its hover breakdown ("lead" | "stab" | null).
    const [info, setInfo] = useState(null);

    // Adaptive fit: on smaller/laptop screens the command bar is wider than the lane
    // its gutters leave it, so scale the whole bar down just enough to fit. Uses
    // transform: scale() (NOT the `zoom` property, which vanishes under backdrop-filter
    // on some Chromium builds — that hid the whole bar) with a readable floor so it
    // never shrinks to an illegible sliver; below the floor it may nudge slightly into
    // the gutters rather than disappear. transform doesn't affect layout, so scrollWidth
    // stays the true natural width (no measure->scale feedback), and a negative margin
    // pulls the ticker up to the bar's scaled bottom so there's no gap.
    //
    // The box is `w-max min-w-full`, which is what makes the scale land: the bar
    // takes the width its rows actually need and never less than the lane, so the
    // scale is measured against the same box the panel frame is drawn on and the
    // whole bar, arsenal and commander badge included, lands inside the lane. A
    // `w-full` box pins the frame to the lane while the rows spill past its right
    // edge, and at 1280 that spill runs 16px wider than the page.
    const FIT_FLOOR = 0.82;
    const barRef = useRef(null);
    const [fit, setFit] = useState({scale: 1, mb: 0});
    // The last geometry a measure acted on. The margin the fit writes lands on a
    // box the observer watches, so every commit re-enters the callback; without
    // this the re-entry re-measures, re-commits and React tears the render down
    // with "Maximum update depth exceeded". Nothing has actually moved on that
    // second pass, so identical geometry returns before touching state and the
    // loop has nowhere to go. Height is part of the key because the margin is
    // derived from it; a panel's own margin never changes its own height, so
    // keying on it cannot reopen the loop.
    const lastRef = useRef({avail: 0, natural: 0, h: 0});
    useLayoutEffect(() => {
        const measure = () => {
            const bar = barRef.current,
                lane = bar?.parentElement;
            if (!bar || !lane) return;
            const avail = lane.clientWidth,
                natural = bar.scrollWidth,
                h = bar.offsetHeight;
            if (!avail || !natural) return;
            const seen = lastRef.current;
            if (seen.avail === avail && seen.natural === natural && seen.h === h) return;
            lastRef.current = {avail, natural, h};
            const scale = clamp(avail / natural, FIT_FLOOR, 1);
            const mb = scale < 1 ? -Math.round(h * (1 - scale)) : 0;
            setFit((p) => (Math.abs(p.scale - scale) < 0.004 && p.mb === mb ? p : {scale, mb}));
        };
        measure();
        const bar = barRef.current,
            lane = bar?.parentElement;
        const ro = new ResizeObserver(measure);
        if (bar) ro.observe(bar);
        if (lane) ro.observe(lane);
        return () => ro.disconnect();
    }, []);

    // A speed / nav control that is currently the active one. The amber wash plus
    // its hairline is the whole active vocabulary in the HUD: the solid amber fill
    // stays reserved for the one primary action a modal offers.
    const ACTIVE = "bg-gold-soft border-gold-line text-gold";

    return (
        <div
            ref={barRef}
            style={
                fit.scale < 1
                    ? {transform: `scale(${fit.scale})`, transformOrigin: "top center", marginBottom: fit.mb}
                    : undefined
            }
            className="db-livehud relative z-5 w-max min-w-full flex flex-col pointer-events-auto motion-safe:animate-[dbDropInY_300ms_var(--ease-drawer)]"
        >
            {/* The panel frame rides on its own layer rather than on the bar. A
                clip-path cuts every descendant along with the box, and three things
                open downward out of this bar — the two telemetry breakdowns and the
                commander badge's menu — so a clip on the bar itself would take them
                with it. This layer paints the identical surface, hairline, notch,
                tab and scanlines, and has nothing inside it to lose. */}
            <i
                className="db-hud-panel absolute inset-0 -z-10 pointer-events-none [--db-tab:135px]"
                aria-hidden="true"
            />
            {/* Row 1 — telemetry: date + points on the left, national stats pushed right. */}
            <div className="flex flex-nowrap items-center gap-3 whitespace-nowrap px-4 py-2 border-b border-hair">
                <div className="flex flex-col items-start leading-none">
                    <span className={KICKER}>Date</span>
                    <span className={cn(FIGURE, "mt-[2px]")}>{date}</span>
                    <span className={SUBLINE}>{time}</span>
                </div>
                <Divider />
                <div className="flex flex-col items-start leading-none">
                    <span className="font-display text-[26px] font-bold text-gold leading-[28px] [text-shadow:var(--glow-gold)]">
                        {Math.floor(myNation?.points ?? 0)}
                    </span>
                    <span className={cn(KICKER, "mt-[1px]", net < 0 && "text-danger")}>PTS · {fmtNet(net)}/s</span>
                    {net < 0 && (
                        <span className="db-notch-sm mt-[3px] flex items-center gap-[5px] font-mono text-[9px] font-bold tracking-[0.12em] leading-none text-red bg-[rgba(224,87,79,0.12)] border border-danger px-[6px] py-[3px]">
                            <span className="db-led db-led-live" aria-hidden="true" />
                            DEFICIT
                        </span>
                    )}
                </div>
                <div className="flex flex-nowrap items-center gap-3 ml-auto">
                    <Divider />
                    <Cell
                        label="GDP"
                        value={fmtGdp(gdp)}
                        sub={<span className={SUBLINE}>Industry +{ind.toFixed(1)}/s</span>}
                    />
                    <Divider />
                    <Cell
                        label="Population"
                        led={popRate > 0 && pop > 0 ? "db-led-ok" : null}
                        value={fmtPop(pop)}
                        sub={
                            popRate > 0 && pop > 0 ? (
                                <PopTrend rate={popRate} base={pop} label className="text-[9.5px]" />
                            ) : (
                                <span className={SUBLINE}>Living citizens</span>
                            )
                        }
                    />
                    <Divider />
                    <Cell
                        label="Powers"
                        value={
                            <span aria-live="polite" className="tabular-nums">
                                {rivals}
                            </span>
                        }
                        sub={<span className={SUBLINE}>Still in the war</span>}
                    />
                    {lead && (
                        <>
                            <Divider />
                            <Cell
                                label="Leadership"
                                led={vitLed(lead.pct)}
                                value={`${lead.pct}%`}
                                valueColor={vitColor(lead.pct)}
                                sub={
                                    <span className={SUBLINE} aria-live="polite">
                                        {leadSub(lead)}
                                    </span>
                                }
                                meter={lead.pct / 100}
                                meterColor={vitColor(lead.pct)}
                                className="cursor-help"
                                onMouseEnter={() => setInfo("lead")}
                                onMouseLeave={() => setInfo(null)}
                            >
                                {info === "lead" && (
                                    <div
                                        className={cn(
                                            popoverCard(),
                                            "absolute top-full right-0 mt-2 w-[240px] z-20 text-left cursor-default [--db-tab:96px]",
                                        )}
                                    >
                                        <header className="flex items-center justify-between gap-3 px-[13px] py-[7px]">
                                            <span>National Leadership</span>
                                            <span
                                                className="font-mono text-[11px] tracking-normal tabular-nums"
                                                style={{color: vitColor(lead.pct)}}
                                            >
                                                {lead.pct}%
                                            </span>
                                        </header>
                                        <div className="px-[13px] pt-[9px] pb-[11px]">
                                            <div className={KICKER}>
                                                {lead.total - lead.lost} of {lead.total} tokens intact
                                            </div>
                                            <div className="mt-[9px] flex flex-col gap-[5px] text-[11.5px]">
                                                {lead.atCities.map((c) => (
                                                    <div
                                                        key={c.name}
                                                        className="flex items-center justify-between gap-3"
                                                    >
                                                        <span className="text-dim truncate flex items-center gap-1">
                                                            {!!c.cap && (
                                                                <Icon name="star" size={9} className="text-gold" />
                                                            )}
                                                            {c.name}
                                                        </span>
                                                        <b className="font-mono text-text tabular-nums flex-none">
                                                            {c.n}
                                                        </b>
                                                    </div>
                                                ))}
                                                {lead.sheltered > 0 && (
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-dim">In bunker</span>
                                                        <b className="font-mono text-text tabular-nums flex-none">
                                                            {lead.sheltered}
                                                        </b>
                                                    </div>
                                                )}
                                                {lead.inTransit > 0 && (
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-dim">In transit (evac)</span>
                                                        <b className="font-mono text-text tabular-nums flex-none">
                                                            {lead.inTransit}
                                                        </b>
                                                    </div>
                                                )}
                                                {lead.lost > 0 && (
                                                    <div className="flex items-center justify-between gap-3">
                                                        <span className="text-danger">Killed</span>
                                                        <b className="font-mono text-danger tabular-nums flex-none">
                                                            {lead.lost}
                                                        </b>
                                                    </div>
                                                )}
                                                {!lead.atCities.length &&
                                                    !lead.sheltered &&
                                                    !lead.inTransit &&
                                                    !lead.lost && <div className="text-faint">No leaders located.</div>}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Cell>
                        </>
                    )}
                    {stab && (
                        <>
                            <Divider />
                            <Cell
                                label="Stability"
                                led={vitLed(stab.pct)}
                                value={`${stab.pct}%`}
                                valueColor={vitColor(stab.pct)}
                                sub={
                                    <span className={SUBLINE} aria-live="polite">
                                        {stabSub(stab)}
                                    </span>
                                }
                                meter={stab.pct / 100}
                                meterColor={vitColor(stab.pct)}
                                className="cursor-help"
                                onMouseEnter={() => setInfo("stab")}
                                onMouseLeave={() => setInfo(null)}
                            >
                                {info === "stab" && stabInfo && (
                                    <div
                                        className={cn(
                                            popoverCard(),
                                            "absolute top-full right-0 mt-2 w-[250px] z-20 text-left cursor-default [--db-tab:92px]",
                                        )}
                                    >
                                        <header className="flex items-center justify-between gap-3 px-[13px] py-[7px]">
                                            <span>National Stability</span>
                                            <span
                                                className="font-mono text-[11px] tracking-normal tabular-nums"
                                                style={{color: vitColor(stabInfo.pct)}}
                                            >
                                                {stabInfo.pct}%
                                            </span>
                                        </header>
                                        <div className="px-[13px] pt-[9px] pb-[11px]">
                                            <div className="flex flex-col gap-[6px] text-[11.5px]">
                                                {stabInfo.factors.length ? (
                                                    stabInfo.factors.map((f) => (
                                                        <div
                                                            key={f.key}
                                                            className="flex items-start justify-between gap-3"
                                                        >
                                                            <span className="flex flex-col">
                                                                <span className="text-dim">{f.label}</span>
                                                                <span className="text-faint text-[10px]">
                                                                    {f.detail}
                                                                </span>
                                                            </span>
                                                            <b className="font-mono text-danger tabular-nums flex-none">
                                                                &minus;{f.penalty}
                                                            </b>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-faint">
                                                        No active pressures. Holding steady.
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={cn(
                                                    KICKER,
                                                    "mt-[9px] pt-[8px] border-t border-hair flex items-center justify-between",
                                                )}
                                            >
                                                <span>Trending toward</span>
                                                <b
                                                    className="font-mono text-[11.5px] tabular-nums"
                                                    style={{color: vitColor(stabInfo.target)}}
                                                >
                                                    {stabInfo.target}%
                                                </b>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Cell>
                        </>
                    )}
                </div>
            </div>
            {/* Row 2 — controls: speed + console nav on the left, arsenal + view controls right. */}
            <div className="flex flex-nowrap items-center gap-3 whitespace-nowrap px-3 py-[7px]">
                {online ? (
                    <div
                        className="flex items-center gap-[7px] pr-3 border-r border-line-soft"
                        title="Online matches run locked at 1× and cannot be paused"
                        aria-live="polite"
                    >
                        <span className="db-led db-led-live" aria-hidden="true" />
                        {world.startsIn > 0 ? (
                            <span className="font-mono text-xs font-bold text-gold [text-shadow:var(--glow-gold)] tabular-nums">
                                Battle begins in {world.startsIn}s
                            </span>
                        ) : (
                            <span className="font-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-dim">
                                Live · 1×
                            </span>
                        )}
                    </div>
                ) : (
                    <div
                        className="flex gap-[3px] pr-[3px] border-r border-line-soft"
                        title={`${keyLabel(K.pause)}: Pause · ${keyLabel(K.speedDown)}/${keyLabel(K.speedUp)}: Speed · 1-5: Speed Level`}
                    >
                        <button
                            className={cn(
                                "min-w-[30px] h-7 rounded-sm border border-transparent bg-transparent text-dim font-mono text-xs font-semibold transition-[color,background,border-color] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:bg-hair active:scale-[0.98]",
                                world.paused && ACTIVE,
                            )}
                            onClick={api.pause}
                            aria-pressed={world.paused}
                            aria-label="Pause"
                            title={`Pause (${keyLabel(K.pause)})`}
                        >
                            <Icon name="pause" size={13} className="mx-auto" />
                        </button>
                        <button
                            className="min-w-[30px] h-7 rounded-sm border border-transparent bg-transparent text-dim font-mono text-xs font-semibold transition-[color,background,border-color] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:bg-hair active:scale-[0.98]"
                            onClick={api.play}
                            aria-pressed={!world.paused}
                            aria-label="Resume"
                            title={`Resume (${keyLabel(K.pause)})`}
                        >
                            <Icon name="play" size={12} className="mx-auto" />
                        </button>
                        {GAME_SPEEDS.map((s, i) => (
                            <button
                                key={s}
                                className={cn(
                                    "min-w-[30px] h-7 rounded-sm border border-transparent bg-transparent text-dim font-mono text-xs font-semibold tabular-nums transition-[color,background,border-color] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:bg-hair active:scale-[0.98]",
                                    !world.paused && world.speed === s && ACTIVE,
                                )}
                                aria-pressed={!world.paused && world.speed === s}
                                onClick={() => api.setSpeed(s)}
                                title={`Speed ${s}× (${i + 1})`}
                            >
                                {s}×
                            </button>
                        ))}
                    </div>
                )}
                {onPanel && (
                    <div className="flex gap-[5px] flex-none">
                        {NAV.map((n) => (
                            <button
                                key={n.id}
                                className={cn(
                                    "db-brackets relative flex items-center gap-[6px] px-[11px] py-[7px] font-display font-semibold text-[10.5px] tracking-[0.12em] uppercase whitespace-nowrap text-dim bg-sunk border border-line rounded-sm cursor-pointer transition-[border-color,color,background] duration-[var(--dur-fast)] ease-out-db hover:text-text hover:border-gold-line active:scale-[0.98]",
                                    panel === n.id && ACTIVE,
                                )}
                                onClick={() => onPanel(n.id)}
                                title={K[n.id] ? `${n.label} (${keyLabel(K[n.id])})` : n.label}
                                aria-label={n.label}
                                aria-pressed={panel === n.id}
                            >
                                <Icon name={n.icon} size={14} />
                                <span>{n.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                    <AmmoBar nation={myNation} />
                    {onGlobe && (
                        <button
                            className={iconButton()}
                            onClick={onGlobe}
                            title="Globe / Flat view"
                            aria-label="Toggle globe or flat view"
                        >
                            <Icon name={globe ? "globe" : "grid"} size={16} />
                        </button>
                    )}
                    {onHelp && (
                        <button
                            className={iconButton()}
                            onClick={onHelp}
                            title="Controls (?)"
                            aria-label="Show controls reference"
                        >
                            <Icon name="help" size={16} />
                        </button>
                    )}
                    {onMenu && (
                        <button
                            className={iconButton()}
                            onClick={onMenu}
                            title="Menu (Esc)"
                            aria-label="Open pause menu"
                        >
                            <Icon name="menu" size={16} />
                        </button>
                    )}
                    {meBadge}
                </div>
            </div>
        </div>
    );
}
