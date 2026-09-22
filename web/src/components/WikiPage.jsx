import {useEffect, useMemo, useState} from "react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import GameIcon from "./GameIcon.jsx";
import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";
import {CATEGORIES_WITH_UNITS, UNIT_MAX} from "../lib/wiki.js";
import {cn} from "../lib/cn.js";
import {chip, panel} from "../lib/variants.js";

// A value's share of the largest that field reaches anywhere in the roster,
// clamped to the track. A field the unit does not carry has no bar.
function share(value, max) {
    if (typeof value !== "number" || !max) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
}

// One of the four headline numbers, over a segmented meter that reads it against
// the roster. Mono number, micro-label, ticks a glance can count.
function StatTile({label, value, unit, pct}) {
    return (
        <div className="db-notch-sm flex flex-col gap-1 border border-line bg-sunk px-3 py-2">
            <span className="font-display text-[9px] font-semibold uppercase tracking-[0.22em] text-faint">
                {label}
            </span>
            <span className="font-mono text-[15px] leading-none text-text tabular-nums">
                {value}
                {unit && (
                    <span className="ml-1 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">{unit}</span>
                )}
            </span>
            {/* The number above carries the value; the meter is the same fact in
                a shape, so it is not read out twice. */}
            <span aria-hidden className="db-seg mt-1 block h-1.5 w-full bg-line-soft">
                <span className="block h-full bg-gold" style={{width: `${pct}%`}} />
            </span>
        </div>
    );
}

// A single row in the mini stats table. `k` is the field name; `v` is the value.
function StatRow({k, v}) {
    return (
        <div className="flex items-baseline justify-between gap-4 border-t border-hair py-2 first:border-t-0">
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">{k}</span>
            <span className="text-right font-mono text-[13px] text-text tabular-nums">{v}</span>
        </div>
    );
}

// One filter in the rail. The label never moves between states: the resting
// hairline under the strip and the active 2px amber rule are both drawn over the
// tab rather than added to its box.
function FilterTab({active, onClick, children}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                "relative shrink-0 cursor-pointer px-[18px] py-3 font-display text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors duration-[var(--dur-fast)] ease-out-db",
                active ? "db-notch-sm bg-gold-soft text-gold" : "text-dim hover:text-text",
            )}
        >
            {children}
            {active && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-gold" />}
        </button>
    );
}

function UnitCard({unit, categoryLabel}) {
    return (
        <article
            className={cn(
                panel(),
                "flex h-full flex-col bg-bg-2 p-6 transition-colors duration-[var(--dur)] hover:border-gold-line",
            )}
        >
            <header className="flex items-start gap-4">
                <span className="db-notch-sm flex h-14 w-14 shrink-0 items-center justify-center border border-gold-line bg-gold-soft text-gold">
                    <GameIcon name={unit.icon} size={30} />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[15px] font-bold uppercase tracking-[0.06em] text-text">
                        {unit.label}
                    </h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                        {categoryLabel}
                        {unit.maxCount === 1 && <span className="ml-2 text-danger">Unique</span>}
                    </p>
                </div>
            </header>

            {unit.summary && <p className="mt-4 text-[13.5px] leading-relaxed text-dim">{unit.summary}</p>}

            {/* Cost / upkeep / build time / HP — the four numbers every player checks. */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Cost" value={unit.cost} unit="pts" pct={share(unit.cost, UNIT_MAX.cost)} />
                <StatTile label="Upkeep" value={unit.upkeep} unit="pts/s" pct={share(unit.upkeep, UNIT_MAX.upkeep)} />
                <StatTile
                    label="Build"
                    value={unit.buildTime}
                    unit="s"
                    pct={share(unit.buildTime, UNIT_MAX.buildTime)}
                />
                <StatTile label="HP" value={unit.hp} pct={share(unit.hp, UNIT_MAX.hp)} />
            </div>

            {/* Detailed stats — weapon reach, intercept chance, sensor coverage, etc. */}
            {unit.stats?.length > 0 && (
                <div className={cn(panel({frame: "well"}), "mt-5 p-4")}>
                    {unit.stats.map(([k, v]) => (
                        <StatRow key={k} k={k} v={v} />
                    ))}
                </div>
            )}

            {/* Gates: only rendered when the unit has a hangar-style parent or a
                base prerequisite. */}
            {(unit.requiresUnit || unit.deployedFrom) && (
                <div className="mt-5 flex flex-col gap-2 border-t border-hair pt-4">
                    {unit.deployedFrom && (
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-faint">
                                Deployed from
                            </span>
                            <span className="text-right font-mono text-[11.5px] text-text">{unit.deployedFrom}</span>
                        </div>
                    )}
                    {unit.requiresUnit && (
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-faint">
                                Requires
                            </span>
                            <span className="text-right font-mono text-[11.5px] text-text">{unit.requiresUnit}</span>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

export default function WikiPage({onSignIn, onShowShortcuts}) {
    // "all" | one of CATEGORIES[].id. Kept in local state, synced to the URL
    // hash so a wiki link like #/wiki/naval lands on the right section.
    const [activeCategory, setActiveCategory] = useState(() => {
        const seg = window.location.hash.replace(/^#\/wiki\/?/, "").split("/")[0];
        return CATEGORIES_WITH_UNITS.some((c) => c.id === seg) ? seg : "all";
    });

    // Persist category selection into the hash so refresh + share preserve it.
    useEffect(() => {
        const target = activeCategory === "all" ? "#/wiki" : `#/wiki/${activeCategory}`;
        if (window.location.hash !== target) {
            history.replaceState(null, "", target);
        }
    }, [activeCategory]);

    // Scroll to top when we mount so the header is visible on route entry.
    useEffect(() => {
        window.scrollTo({top: 0, behavior: "auto"});
    }, []);

    // Selecting a category re-filters the list — jump back to the top so the new
    // section reads from its header rather than wherever the last one left us.
    function selectCategory(id) {
        setActiveCategory(id);
        window.scrollTo({top: 0, behavior: "smooth"});
    }

    const shown = useMemo(() => {
        if (activeCategory === "all") return CATEGORIES_WITH_UNITS;
        return CATEGORIES_WITH_UNITS.filter((c) => c.id === activeCategory);
    }, [activeCategory]);

    return (
        <div className="relative min-h-dvh bg-bg text-text">
            <Nav onSignIn={onSignIn} />

            <main>
                <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-16">
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-vignette" />
                    <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8">
                        <Reveal>
                            <Eyebrow framed>Field Manual</Eyebrow>
                            <h1 className="mt-5 max-w-4xl font-display text-[clamp(2rem,5vw,3.6rem)] font-bold uppercase leading-[1.02] text-text">
                                The DomeBreak <span className="text-dim">arsenal</span>
                            </h1>
                            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-dim">
                                Every unit in the roster, straight from the sim: cost, upkeep, build time, HP, reach,
                                and payload. Prices are in build points, ranges are in kilometers, and times are in
                                game-seconds.
                            </p>
                        </Reveal>
                    </div>
                </section>

                <div className="sticky top-16 z-40 border-y border-line bg-chrome-strong backdrop-blur-[10px]">
                    <div className="mx-auto flex max-w-[1400px] items-stretch overflow-x-auto px-5 sm:px-8 db-scroll">
                        <FilterTab active={activeCategory === "all"} onClick={() => selectCategory("all")}>
                            All
                        </FilterTab>
                        {CATEGORIES_WITH_UNITS.map((c) => (
                            <FilterTab key={c.id} active={activeCategory === c.id} onClick={() => selectCategory(c.id)}>
                                {c.label}
                            </FilterTab>
                        ))}
                    </div>
                </div>

                <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 sm:py-20">
                    {shown.map((c, ci) => (
                        <section key={c.id} id={`wiki-${c.id}`} className={cn(ci > 0 && "mt-20")}>
                            <Reveal>
                                <div className="flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <span className={chip({tone: "subtle", shape: "notch"})}>
                                            {`§ ${String(CATEGORIES_WITH_UNITS.findIndex((x) => x.id === c.id) + 1).padStart(2, "0")}`}
                                        </span>
                                        <h2 className="mt-3 font-display text-[clamp(1.4rem,3vw,2.1rem)] font-bold uppercase leading-tight text-text">
                                            {c.label}
                                        </h2>
                                        <p className="mt-2 max-w-2xl text-[14px] text-dim">{c.blurb}</p>
                                    </div>
                                    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-faint">
                                        <span className="db-led db-led-sensor" />
                                        {c.units.length} unit{c.units.length === 1 ? "" : "s"}
                                    </span>
                                </div>
                            </Reveal>

                            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {c.units.map((u, i) => (
                                    <Reveal
                                        key={u.id}
                                        delay={Math.min(i * 0.04, 0.24)}
                                        className="db-brackets db-brackets-hover relative h-full"
                                    >
                                        <UnitCard unit={u} categoryLabel={c.label} />
                                    </Reveal>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </main>

            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}
