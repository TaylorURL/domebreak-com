// Talks — every power in the theatre, in the dock's drawer. The war board sits
// at the top whenever the player is at war (the alert stack's War Board button
// opens this drawer), then the roster: flag, name, the seat commanding it, its
// holdings and standing toward you, and the war/peace/alliance controls.
// Presentation only — declareWar / offerPeace / proposeAlliance / breakAlliance
// go through the api.
import {useState} from "react";
import {DrawerScreen} from "./ScreenFrame.jsx";
import Flag from "../common/Flag.jsx";
import Icon from "../common/Icon.jsx";
import {colorForSlot, DIPLOMACY} from "../../game/data/constants.js";
import {miniButton, input} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import {fmtGdp} from "../lib/format.js";
import {useRoster} from "../lib/roster.js";

// One figure in the strip under the header.
function Readout({label, value, tone}) {
    return (
        <div className="flex flex-col gap-[3px] min-w-0 px-3 py-2 border-r border-line last:border-r-0">
            <b className={cn("font-mono tabular-nums text-[13px] font-semibold leading-none", tone)}>{value}</b>
            <span className="text-[10px] leading-none text-faint truncate">{label}</span>
        </div>
    );
}

// A power's standing toward you, stated by a lamp as well as a word.
function Standing({label, tone = "text-dim", led}) {
    return (
        <span className={cn("inline-flex items-center gap-[6px] text-[11.5px]", tone)}>
            {led && <i className={cn("db-led", led)} aria-hidden="true" />}
            {label}
        </span>
    );
}

export default function DiplomacyScreen({world, api, mySlot, online, players, onClose}) {
    const [q, setQ] = useState("");
    const {isHuman} = useRoster(players);
    const me = world.nations.find((n) => n.slot === mySlot);
    // Only the ACTIVE (participating) powers are diplomatic actors — the passive
    // neutral world never wars or allies, so it never appears here.
    const roster = world.nations.filter((n) => n.active !== false);
    // Precompute holdings/forces per slot in one pass each (indexed by slot, so
    // it stays cheap regardless of how many cities/units exist).
    const cityCount = {},
        forceCount = {};
    for (const c of world.cities) if (c.alive) cityCount[c.slot] = (cityCount[c.slot] || 0) + 1;
    for (const u of world.units) if (u.hp > 0) forceCount[u.slot] = (forceCount[u.slot] || 0) + 1;
    const citiesOf = (slot) => cityCount[slot] || 0;
    const forcesOf = (slot) => forceCount[slot] || 0;
    // Your standing toward a slot: "war" | "ally" | "peace" (absent reads as peace).
    const rel = (n) =>
        n.slot === mySlot
            ? "self"
            : me?.relations[n.slot] === "war"
              ? "war"
              : me?.relations[n.slot] === "ally"
                ? "ally"
                : "peace";
    // Diplomatic sort priority — the powers that matter to you rise to the top:
    // you, then human players, then everyone you're at war with, then your
    // allies, then the rest. Ties within a bucket fall back to alive-then-holdings.
    const priority = (n) =>
        n.slot === mySlot
            ? 0
            : online && isHuman(n.slot) && n.alive
              ? 1
              : rel(n) === "war"
                ? 2
                : rel(n) === "ally"
                  ? 3
                  : 4;
    const nations = [...roster].sort(
        (a, b) => priority(a) - priority(b) || b.alive - a.alive || citiesOf(b.slot) - citiesOf(a.slot),
    );
    // Rank is TRUE standings (alive-then-holdings), computed off a separate sort
    // so the diplomatic display order above never distorts each power's real rank.
    const standings = [...roster].sort((a, b) => b.alive - a.alive || citiesOf(b.slot) - citiesOf(a.slot));
    const rankOf = new Map(standings.map((n, i) => [n.slot, i + 1]));

    const graceSec = world.rules?.playerGraceSec ?? DIPLOMACY.playerGraceSec;
    const graceActive = graceSec > 0 && (world.time ?? 0) < graceSec;
    const aliveCount = roster.filter((n) => n.alive).length;
    const atWar = roster.filter((n) => n.slot !== mySlot && me?.relations[n.slot] === "war").length;
    const allied = roster.filter((n) => n.slot !== mySlot && me?.relations[n.slot] === "ally").length;
    const needle = q.trim().toLowerCase();
    const shown = needle
        ? nations.filter((n) => n.name.toLowerCase().includes(needle) || n.iso.toLowerCase() === needle)
        : nations;

    // The war board: every live war in the theatre, each pair once, the ones
    // you are in first.
    const wars = [];
    for (const a of roster) {
        if (!a.alive) continue;
        for (const b of roster) {
            if (b.slot <= a.slot || !b.alive) continue;
            if (a.relations?.[b.slot] === "war") wars.push({a, b, mine: a.slot === mySlot || b.slot === mySlot});
        }
    }
    wars.sort((x, y) => y.mine - x.mine);

    const seat = (n) =>
        n.slot === mySlot
            ? {label: "You", cls: "bg-accent border-accent text-accent-ink"}
            : isHuman(n.slot)
              ? {label: "Player", cls: "border-[var(--ally)] text-[var(--ally)]"}
              : {label: "AI", cls: "border-line text-dim"};

    return (
        <DrawerScreen
            title="Talks"
            labelledBy="db-drawer-talks"
            caption={
                <>
                    <b>{citiesOf(mySlot)}</b> cities · <b>{forcesOf(mySlot)}</b> units
                </>
            }
            onClose={onClose}
            foot={
                <p className="m-0 px-4 py-[10px] text-[11px] leading-[1.4] text-faint">
                    The active powers contesting this match: human players and AI great powers.
                </p>
            }
        >
            <div className="grid grid-cols-3 border-b border-line">
                <Readout label="Powers Standing" value={aliveCount} />
                <Readout label="At War With" value={atWar} tone={atWar ? "text-red" : undefined} />
                <Readout label="Alliances" value={allied} tone={allied ? "text-[var(--ally)]" : undefined} />
            </div>

            {wars.length > 0 && (
                <section className="px-4 py-3 border-b border-line">
                    <h4 className="db-sec m-0 mb-2">War Board</h4>
                    <ul className="m-0 p-0 list-none flex flex-col gap-[7px]">
                        {wars.map(({a, b, mine}) => (
                            <li
                                key={`${a.slot}-${b.slot}`}
                                className={cn(
                                    "flex items-center gap-[8px] text-[12px]",
                                    mine ? "text-text" : "text-dim",
                                )}
                            >
                                <i className={cn("db-mark", mine && "war")} aria-hidden="true" />
                                <Flag iso={a.iso} className="w-[18px] h-[12px] flex-none" />
                                <span className="min-w-0 truncate">{a.name}</span>
                                <Icon name="swords" size={12} className="flex-none text-faint" />
                                <Flag iso={b.iso} className="w-[18px] h-[12px] flex-none" />
                                <span className="min-w-0 truncate">{b.name}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="px-4 pt-3 pb-1">
                <input
                    className={cn(input(), "px-3 py-2 text-[12.5px]")}
                    placeholder="Search powers by name"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    aria-label="Search powers by name"
                />
            </div>

            <ul className="m-0 p-0 list-none" aria-label="Powers">
                {shown.map((n) => {
                    const isMe = n.slot === mySlot;
                    const standing = rel(n); // "self" | "war" | "ally" | "peace"
                    const war = standing === "war";
                    const s = seat(n);
                    return (
                        <li
                            key={n.slot}
                            className={cn(
                                "flex flex-col gap-[7px] px-4 py-3 border-b border-line",
                                !n.alive && "opacity-50",
                                isMe && "bg-accent-soft",
                            )}
                        >
                            <div className="flex items-center gap-[10px] min-w-0">
                                <span
                                    className="flex-none w-[26px] h-[17px] grid place-items-center overflow-hidden border [&>*]:w-full [&>*]:h-full [&>*]:object-cover"
                                    style={{borderColor: n.color || colorForSlot(n.slot)}}
                                >
                                    <Flag iso={n.iso} />
                                </span>
                                <b className="flex-1 min-w-0 font-semibold text-[13px] truncate">{n.name}</b>
                                <span
                                    className={cn("flex-none px-[8px] py-[2px] text-[10px] font-medium border", s.cls)}
                                >
                                    {s.label}
                                </span>
                                <span className="flex-none font-mono text-[10px] tabular-nums text-faint">
                                    {rankOf.get(n.slot)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                                {isMe ? (
                                    <Standing label="Home" />
                                ) : !n.alive ? (
                                    <Standing label="Eliminated" tone="text-faint" />
                                ) : war ? (
                                    <Standing label="At War" tone="text-red" led="db-led-live" />
                                ) : standing === "ally" ? (
                                    <Standing label="Allied" tone="text-[var(--ally)]" led="db-led-sensor" />
                                ) : (
                                    <Standing label="At Peace" tone="text-good" led="db-led-ok" />
                                )}
                                <span className="ml-auto font-mono text-[11px] tabular-nums text-dim whitespace-nowrap">
                                    {n.alive ? `${citiesOf(n.slot)}c · ${forcesOf(n.slot)}u · ` : "— · — · "}
                                    {fmtGdp(n.gdp, 1)}
                                </span>
                            </div>
                            {!isMe && n.alive && (
                                <div className="flex justify-end gap-[6px]">
                                    {war ? (
                                        online ? (
                                            <span
                                                className="text-[11px] text-faint"
                                                title="Peace terms are single player only for now"
                                            >
                                                Peace terms are single player only
                                            </span>
                                        ) : (
                                            <button
                                                className={miniButton()}
                                                aria-label={`Offer white peace to ${n.name}`}
                                                onClick={() => api.offerPeace(n.slot)}
                                            >
                                                Offer Peace
                                            </button>
                                        )
                                    ) : standing === "ally" ? (
                                        <button
                                            className={miniButton({danger: true})}
                                            aria-label={`Break the alliance with ${n.name}`}
                                            onClick={() => api.breakAlliance(n.slot)}
                                        >
                                            Break Alliance
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className={miniButton()}
                                                aria-label={`Propose an alliance to ${n.name}`}
                                                onClick={() => api.proposeAlliance(n.slot)}
                                            >
                                                Ally
                                            </button>
                                            <button
                                                className={miniButton({danger: true})}
                                                aria-label={`Declare war on ${n.name}`}
                                                disabled={graceActive}
                                                title={
                                                    graceActive
                                                        ? "Opening grace holds. No war can be declared yet."
                                                        : undefined
                                                }
                                                onClick={() => api.declareWar(n.slot)}
                                            >
                                                Declare War
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </DrawerScreen>
    );
}
