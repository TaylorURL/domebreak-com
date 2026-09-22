import {useState} from "react";
import {
    gdpOf,
    incomeOf,
    industryCapOf,
    industryCountOf,
    industryOutputOf,
    industryPendingOf,
    leadershipStatus,
    netIncomeOf,
    populationOf,
    populationTrendOf,
    stabilityBreakdown,
    stabilityStatus,
    upkeepOf,
} from "../../game/engine.js";
import {GAME_SPEEDS} from "../../game/data/constants.js";
import {keyLabel, resolveKeys} from "../../game/platform/keybindings.js";
import {fmtGdp, fmtNet, fmtPop} from "../lib/format.js";
import {cn} from "../lib/cn.js";
import Flag from "../common/Flag.jsx";
import Icon from "../common/Icon.jsx";
import PopTrend from "../common/PopTrend.jsx";
import {popoverCard} from "../lib/variants.js";
import {gameDate} from "../lib/gameClock.js";

// The speed segment's label: the multiplier as the rules define it.
const speedLabel = (s) => `${s}×`;

// A leadership picture in one word, for the vitals bar's read-out.
function leadWord(lead) {
    if (!lead) return "";
    if (lead.mode === "shelter") return "Evacuating";
    if (lead.exposed && lead.atWar) return "Exposed";
    if (lead.inTransit > 0) return "Evacuating";
    if (lead.sheltered > 0) return "Sheltered";
    return "Secure";
}

// One stat cell: the glyph, the figure, and the label carrying its delta.
function Stat({icon, value, label, delta, score, className, children, ...rest}) {
    return (
        <div
            className={cn(
                "relative flex items-center gap-[10px] px-[18px] border-l border-line max-[1801px]:px-[12px]",
                className,
            )}
            {...rest}
        >
            <Icon name={icon} size={18} className="text-dim" />
            <div className="leading-none">
                <div
                    className={cn(
                        "font-mono tabular-nums leading-none",
                        score ? "text-[22px] font-semibold text-accent" : "text-[16px] font-semibold text-text",
                    )}
                >
                    {value}
                </div>
                <div className="mt-[4px] flex items-center gap-[6px] text-[11px] leading-none text-faint">
                    {label}
                    {delta && <span className="font-mono tabular-nums text-[11px] text-dim">{delta}</span>}
                </div>
            </div>
            {children}
        </div>
    );
}

// One vitals bar: a label, a mono figure, and a 4px track. `warn` turns the
// figure and the fill red, which is the only colour the strip ever carries.
function Gauge({label, read, frac, warn, className, children, ...rest}) {
    return (
        <div
            className={cn(
                "relative flex flex-col justify-center gap-[5px] px-[18px] border-l border-line min-w-[176px]",
                "max-[1801px]:min-w-[136px] max-[1801px]:px-[12px] max-[1281px]:min-w-[112px]",
                className,
            )}
            {...rest}
        >
            <div className="flex items-baseline justify-between gap-3 text-[11px] leading-none text-faint">
                <span>{label}</span>
                <b className={cn("font-mono text-[11px] font-semibold tabular-nums", warn ? "text-red" : "text-text")}>
                    {read}
                </b>
            </div>
            <div
                className="h-[4px] bg-line"
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(frac * 100)}
            >
                <i
                    className={cn(
                        "block h-full transition-[width] duration-300 ease-out-db",
                        warn ? "bg-red" : "bg-accent",
                    )}
                    style={{width: `${Math.max(0, Math.min(1, frac)) * 100}%`}}
                />
            </div>
            {children}
        </div>
    );
}

// A hover breakdown, dropped from the cell it annotates.
function Breakdown({title, read, children}) {
    return (
        <div className={cn(popoverCard(), "absolute top-full right-0 mt-2 w-[248px] z-20 text-left cursor-default")}>
            <header className="flex items-center justify-between gap-3 px-[13px] py-[8px]">
                <span>{title}</span>
                <span className="font-mono text-[11px] font-semibold tabular-nums text-text">{read}</span>
            </header>
            <div className="px-[13px] pt-[9px] pb-[11px] flex flex-col gap-[6px] text-[11.5px]">{children}</div>
        </div>
    );
}

// One row inside a breakdown: a name on the left, a mono figure on the right.
function Line({label, detail, value, tone}) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="flex flex-col min-w-0">
                <span className={cn("truncate", tone === "danger" ? "text-red" : "text-dim")}>{label}</span>
                {detail && <span className="text-[10px] text-faint">{detail}</span>}
            </span>
            <b className={cn("flex-none font-mono tabular-nums", tone === "danger" ? "text-danger" : "text-text")}>
                {value}
            </b>
        </div>
    );
}

// The status strip: one 52px line across the top of the match carrying who you
// are, the clock and the speed control, the five national figures, and the two
// vitals bars. Everything a glance needs and nothing a glance does not.
export default function StatusStrip({world, api, myNation, mySlot, keys, online, meBadge}) {
    const K = resolveKeys(keys);
    const [info, setInfo] = useState(null); // "gdp" | "lead" | "stab" | null

    const net = myNation ? netIncomeOf(world, myNation.slot) : 0;
    const income = myNation ? incomeOf(world, myNation.slot) : 0;
    const upkeep = myNation ? upkeepOf(world, myNation.slot) : 0;
    const pop = myNation ? populationOf(world, myNation.slot) : 0;
    const popRate = myNation ? populationTrendOf(world, myNation.slot) : 0;
    const gdp = myNation ? gdpOf(world, myNation.slot) : 0;
    const indOut = myNation ? industryOutputOf(world, myNation.slot) : 0;
    const indUsed = myNation ? industryCountOf(world, mySlot) + industryPendingOf(world, mySlot) : 0;
    const indCap = myNation ? industryCapOf(world, mySlot) : 0;
    const lead = myNation ? leadershipStatus(world, myNation.slot) : null;
    const stab = myNation ? stabilityStatus(world, myNation.slot) : null;
    const stabInfo = myNation ? stabilityBreakdown(world, myNation.slot) : null;
    const powers = world.nations.filter((n) => n.alive && n.active !== false).length;
    const mine = world.cities.filter((c) => c.slot === mySlot);
    const held = mine.filter((c) => c.alive).length;
    const {date, time} = gameDate(world.time);
    const leadExposed = !!lead && lead.exposed && lead.atWar;

    const segBtn =
        "grid place-items-center h-7 min-w-[36px] px-[10px] border-r border-line last:border-r-0 font-mono text-[12px] font-semibold tabular-nums text-dim transition-colors duration-[var(--dur-fast)] ease-out-db hover:text-text";

    return (
        <div
            className="relative w-full h-[52px] flex items-stretch bg-panel-2 border-b border-line pointer-events-auto"
            aria-label="National status"
        >
            <div className="flex items-center gap-3 min-w-0 px-[22px] max-[1441px]:px-[14px] border-r border-line">
                {myNation?.iso && <Flag iso={myNation.iso} className="w-[30px] h-[20px] flex-none" />}
                <div className="min-w-0">
                    <b className="block text-[15px] font-semibold leading-tight truncate">
                        {myNation?.name || "Command"}
                    </b>
                    <small className="block text-[11px] leading-tight text-faint truncate max-[1401px]:hidden">
                        Your command · {held} of {mine.length} territories
                    </small>
                </div>
            </div>

            <div className="flex items-center gap-[18px] max-[1441px]:gap-3 px-[22px] max-[1441px]:px-[14px] border-r border-line">
                <span className="font-mono text-[13.5px] font-medium tabular-nums text-dim whitespace-nowrap">
                    <b className="font-semibold text-text">
                        <span className="max-[1441px]:hidden">{date}</span>
                        <span className="hidden max-[1441px]:inline">{date.split(",")[0]}</span>
                    </b>{" "}
                    · {time}
                </span>
                {online ? (
                    <span className="flex items-center gap-[7px] whitespace-nowrap" aria-live="polite">
                        <span className="db-led db-led-ok" aria-hidden="true" />
                        <span className="font-mono text-[12px] font-semibold tabular-nums text-dim">
                            {world.startsIn > 0 ? `Battle begins in ${world.startsIn}s` : "Live · 1×"}
                        </span>
                    </span>
                ) : (
                    <span className="inline-flex border border-line-2" role="group" aria-label="Game speed">
                        <button
                            type="button"
                            className={cn(segBtn, world.paused && "bg-accent text-accent-ink hover:text-accent-ink")}
                            onClick={world.paused ? api.play : api.pause}
                            aria-pressed={world.paused}
                            title={`Pause (${keyLabel(K.pause)})`}
                        >
                            <Icon name="pause" size={13} />
                        </button>
                        {GAME_SPEEDS.map((s) => (
                            <button
                                type="button"
                                key={s}
                                className={cn(
                                    segBtn,
                                    !world.paused &&
                                        world.speed === s &&
                                        "bg-accent text-accent-ink hover:text-accent-ink",
                                )}
                                aria-pressed={!world.paused && world.speed === s}
                                onClick={() => api.setSpeed(s)}
                                title={`Speed ${speedLabel(s)}`}
                            >
                                {speedLabel(s)}
                            </button>
                        ))}
                    </span>
                )}
            </div>

            <div className="flex items-stretch ml-auto min-w-0">
                <Stat
                    score
                    icon="star"
                    value={Math.floor(myNation?.points ?? 0).toLocaleString()}
                    label="Points"
                    delta={`${fmtNet(net, 1)}/s`}
                />
                <Stat
                    icon="coin"
                    value={fmtGdp(gdp)}
                    label="GDP"
                    className="cursor-help"
                    onMouseEnter={() => setInfo("gdp")}
                    onMouseLeave={() => setInfo(null)}
                >
                    {info === "gdp" && (
                        <Breakdown title="Gross domestic product" read={fmtGdp(gdp)}>
                            <Line label="Income" value={`+${income.toFixed(1)}/s`} />
                            <Line label="Upkeep" value={`−${upkeep.toFixed(1)}/s`} />
                            <Line label="Net" value={`${fmtNet(net, 1)}/s`} tone={net < 0 ? "danger" : undefined} />
                            <Line
                                label="Industry output"
                                detail={`${indUsed} of ${indCap} slots in use`}
                                value={`+${indOut.toFixed(1)}/s`}
                            />
                        </Breakdown>
                    )}
                </Stat>
                <Stat
                    icon="factory"
                    value={
                        <>
                            {indUsed} <span className="text-[12px] text-faint">/ {indCap}</span>
                        </>
                    }
                    label="Industry"
                    delta={indOut > 0 ? `+${indOut.toFixed(1)}/s` : "idle"}
                    className="max-[1281px]:hidden"
                />
                <Stat
                    icon="people"
                    value={fmtPop(pop)}
                    label="Population"
                    delta={<PopTrend rate={popRate} base={pop} label className="text-[11px]" />}
                    className="max-[1681px]:hidden"
                />
                <Stat
                    icon="map"
                    value={<span aria-live="polite">{powers}</span>}
                    label="Powers in the war"
                    className="max-[1681px]:hidden"
                />
                {lead && (
                    <Gauge
                        label="Leadership"
                        read={leadExposed ? "Exposed" : leadWord(lead) === "Secure" ? `${lead.pct}%` : leadWord(lead)}
                        frac={leadExposed ? 1 : lead.pct / 100}
                        warn={leadExposed}
                        className="cursor-help"
                        onMouseEnter={() => setInfo("lead")}
                        onMouseLeave={() => setInfo(null)}
                    >
                        {info === "lead" && (
                            <Breakdown title="National leadership" read={`${lead.pct}%`}>
                                <div className="text-[11px] text-faint">
                                    {lead.total - lead.lost} of {lead.total} tokens intact
                                </div>
                                {lead.atCities.map((c) => (
                                    <Line key={c.name} label={c.name} value={c.n} />
                                ))}
                                {lead.sheltered > 0 && <Line label="In the bunker" value={lead.sheltered} />}
                                {lead.inTransit > 0 && <Line label="In transit" value={lead.inTransit} />}
                                {lead.lost > 0 && <Line label="Killed" value={lead.lost} tone="danger" />}
                                {!lead.atCities.length && !lead.sheltered && !lead.inTransit && !lead.lost && (
                                    <div className="text-faint">No leaders located.</div>
                                )}
                            </Breakdown>
                        )}
                    </Gauge>
                )}
                {stab && (
                    <Gauge
                        label="Stability"
                        read={`${stab.pct}%`}
                        frac={stab.pct / 100}
                        className="cursor-help"
                        onMouseEnter={() => setInfo("stab")}
                        onMouseLeave={() => setInfo(null)}
                    >
                        {info === "stab" && stabInfo && (
                            <Breakdown title="National stability" read={`${stabInfo.pct}%`}>
                                {stabInfo.factors.length ? (
                                    stabInfo.factors.map((f) => (
                                        <Line
                                            key={f.key}
                                            label={f.label}
                                            detail={f.detail}
                                            value={`−${f.penalty}`}
                                            tone="danger"
                                        />
                                    ))
                                ) : (
                                    <div className="text-faint">No active pressures. Holding steady.</div>
                                )}
                                <div className="mt-[3px] pt-[8px] border-t border-hair">
                                    <Line label="Trending toward" value={`${stabInfo.target}%`} />
                                </div>
                            </Breakdown>
                        )}
                    </Gauge>
                )}
                {online && meBadge && <div className="flex items-center pl-3 pr-2 border-l border-line">{meBadge}</div>}
            </div>
        </div>
    );
}
