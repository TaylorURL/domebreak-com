// The selection card: what the player clicked, above the command deck's left
// end. Its name and place, three stat boxes, its orders as equal-width buttons,
// and the per-class controls underneath: the hangar and patrol for an airbase,
// the payload picker for a warhead platform, the leadership airlift for a
// bunker, the capture readout for ground troops. The unit's description and its
// full stat sheet sit behind a Details disclosure, so the card at rest is short
// enough to leave the map under it readable.
//
// A pure presentational component: it reads props only and calls back through
// the api/setState functions the parent owns.
import {useMemo, useState} from "react";
import UnitIcon from "../common/UnitIcon.jsx";
import Icon from "../common/Icon.jsx";
import Meter from "../common/Meter.jsx";
import {
    allowedAmmo,
    annexableBySlot,
    atWar,
    FALLOUT,
    formationGuideOf,
    hangarCapOf,
    hangarCount,
    haversine,
    initialWarhead,
    leadershipStatus,
    PATROL_FIGHTER,
    PATROL_SIZES,
    radarRangeOf,
    defenseRange,
    UNIT_ICON,
    UNITS,
    WARHEADS,
} from "../../game/engine.js";
import {CAPTURE, NEUTRAL, WARHEAD_ICON} from "../../game/data/constants.js";
import {cn} from "../lib/cn.js";
import {clamp01} from "../../lib/math.js";
import {fmtKm, fmtPct, shareOfPct} from "../lib/format.js";

// How far the card will look for a place name before it reports the owner
// alone. Past this the nearest settlement says nothing useful about where a
// ship or a satellite actually is.
const PLACE_KM = 600;

// Two-column label/value sheet: Inter labels over mono figures, the readout
// every instrument in the HUD shares.
function StatRows({rows, className}) {
    return (
        <div className={cn("grid grid-cols-2 gap-x-[14px] gap-y-[7px]", className)}>
            {rows.map(([label, value, valueClass], i) => (
                <div key={i} className="flex flex-col min-w-0">
                    <span className="text-[11px] text-faint leading-[1.3]">{label}</span>
                    <b className="font-mono tabular-nums text-[12.5px] font-semibold leading-[1.3] truncate">
                        <span className={cn("font-mono", valueClass)}>{value}</span>
                    </b>
                </div>
            ))}
        </div>
    );
}

// The three boxes across the head of the card. Range is whatever governs this
// class of unit, the middle box is its magazine where it draws one and its
// integrity where it does not, and status is the one figure that carries colour.
function statBoxes(w, u, def, nation) {
    const range = def.detect
        ? radarRangeOf(u.type)
        : def.kind === "defense"
          ? defenseRange(w, u)
          : def.sortieKm || def.range || def.radarKm || 0;
    const loaded = def.warheads ? u.warhead || initialWarhead(u.type) : null;
    const ammo = loaded
        ? {label: "Ammo", value: String(nation?.ammo?.[loaded] ?? 0)}
        : {label: "Integrity", value: `${Math.round(u.hp)}/${def.hp}`};
    return [{label: "Range", value: range ? fmtKm(range) : "—"}, ammo, status(u, def)];
}

// Status is the one place a stat box carries colour: green when the unit is
// ready to do its job, plain white while it is doing it, dim while it cannot.
function status(u, def) {
    if (u.cooldown > 0) return {label: "Status", value: "Reloading", tone: "dim"};
    if (u.targetId) return {label: "Status", value: "Engaged"};
    if (u.followId) return {label: "Status", value: "In Formation"};
    if (u.dest)
        return {
            label: "Status",
            value: def.navalSpeed ? "Under Way" : def.landSpeed ? "On the March" : "Relocating",
        };
    return {label: "Status", value: "Ready", tone: "ok"};
}

// Nearest settlement to the unit, as "City, State". A unit far out at sea or in
// orbit has no place name, so the sub line falls back to the owner alone.
function placeOf(w, u) {
    let best = Infinity,
        found = null;
    for (const c of w.cities) {
        const d = haversine(u.lng, u.lat, c.lng, c.lat);
        if (d < best) {
            best = d;
            found = c;
        }
    }
    if (!found || best > PLACE_KM) return null;
    return found.state ? `${found.name}, ${found.state}` : found.name;
}

// Whether the Details disclosure is open, carried across every selection for the
// rest of the session so a player who wants the full sheet opens it once.
let detailsOpen = false;

export default function SelectionPanel({
    selectedUnit,
    w,
    myNation,
    mySlot,
    api,
    labelOf,
    teamColor,
    unitStats,
    moving,
    setMoving,
    following,
    setFollowing,
    setPlacing,
    attackMode,
    setAttackMode,
    flash,
}) {
    const def = UNITS[selectedUnit.type];
    const mine = selectedUnit.slot === mySlot;
    const hpFrac = clamp01(selectedUnit.hp / def.hp);
    const owner = w.nations.find((n) => n.slot === selectedUnit.slot);
    // The world is mutated in place, so the unit's own coordinates are what
    // moves. Quantizing them to a twentieth of a degree keeps the scan over the
    // city list off every tick of a ship under way, while still finding the next
    // place name well before the old one stops being true.
    const cell = `${selectedUnit.id}:${Math.round(selectedUnit.lng * 20)}:${Math.round(selectedUnit.lat * 20)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const place = useMemo(() => placeOf(w, selectedUnit), [cell]);
    const sub = [place, mine ? "yours" : owner?.name].filter(Boolean).join(" · ");
    const boxes = statBoxes(w, selectedUnit, def, myNation);
    const blurb = def.desc || def.hint;
    const detailRows = unitStats(selectedUnit) || [];
    const [details, setDetails] = useState(detailsOpen);
    const toggleDetails = () => {
        detailsOpen = !details;
        setDetails(detailsOpen);
    };

    // Every order this unit answers to, in one list, laid out three to a row.
    const orders = [];
    if (mine && def.kind === "offense")
        orders.push(
            selectedUnit.targetId
                ? {label: "Hold Fire", on: true, onClick: () => api.commandAttack(selectedUnit.id, null)}
                : {
                      label: attackMode ? "Pick a Target…" : "Command Attack",
                      on: attackMode,
                      onClick: () => setAttackMode((v) => !v),
                  },
        );
    if (mine && def.sortieKm)
        orders.push(
            selectedUnit.targetId
                ? {label: "Stand Down", on: true, onClick: () => api.commandAttack(selectedUnit.id, null)}
                : {
                      label: attackMode ? "Pick a Target…" : "Command Sortie",
                      on: attackMode,
                      onClick: () => setAttackMode((v) => !v),
                  },
        );
    if (mine) {
        const moveLabel = def.navalSpeed ? "Set Sail" : def.landSpeed ? "March" : "Move";
        orders.push({
            label: moving === selectedUnit.id ? "Pick a Spot…" : moveLabel,
            on: moving === selectedUnit.id,
            onClick: () => {
                setMoving(moving === selectedUnit.id ? null : selectedUnit.id);
                setFollowing(null);
                setPlacing(null);
            },
        });
        if ((def.navalSpeed || def.landSpeed) && selectedUnit.dest)
            orders.push({
                label: def.navalSpeed ? "All Stop" : "Halt",
                onClick: () => api.stopSail(selectedUnit.id),
            });
        if (def.navalSpeed)
            orders.push(
                selectedUnit.followId
                    ? {label: "Break Formation", on: true, onClick: () => api.stopFollow(selectedUnit.id)}
                    : {
                          label: following === selectedUnit.id ? "Pick a Ship…" : "Follow Ship",
                          on: following === selectedUnit.id,
                          onClick: () => {
                              setFollowing(following === selectedUnit.id ? null : selectedUnit.id);
                              setMoving(null);
                              setPlacing(null);
                          },
                      },
            );
    }
    const orderRows = [];
    for (let i = 0; i < orders.length; i += 3) orderRows.push(orders.slice(i, i + 3));

    const guide = selectedUnit.followId ? formationGuideOf(w, selectedUnit) : null;

    return (
        <div
            role="region"
            aria-label="Selected unit"
            className="absolute left-[480px] bottom-[128px] z-5 w-[360px] pointer-events-auto motion-safe:animate-[dbPop_180ms_var(--ease-out)]"
        >
            <div className="db-hud-panel db-scroll max-h-[min(640px,calc(100vh-260px))] overflow-y-auto px-[14px] pt-3 pb-[14px]">
                <div className="flex items-center gap-[10px]">
                    <UnitIcon name={UNIT_ICON[selectedUnit.type]} color={teamColor(selectedUnit.slot)} size={26} />
                    <div className="min-w-0">
                        <b className="block text-[15px] font-semibold leading-[1.25] truncate">
                            {labelOf(selectedUnit.type, selectedUnit.slot)}
                        </b>
                        <small className="block text-[11.5px] text-faint leading-[1.3] truncate">{sub}</small>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-3">
                    {boxes.map((b) => (
                        <div key={b.label} className={cn("db-statbox", b.tone)}>
                            <b>{b.value}</b>
                            <span>{b.label}</span>
                        </div>
                    ))}
                </div>

                {orderRows.map((row, i) => (
                    <div key={i} className="flex gap-1.5 mb-1.5">
                        {row.map((o) => (
                            <button
                                key={o.label}
                                className={cn("db-ibtn flex-1 min-w-0 px-2", o.on && "on")}
                                aria-pressed={!!o.on}
                                onClick={o.onClick}
                            >
                                <span className="truncate">{o.label}</span>
                            </button>
                        ))}
                    </div>
                ))}

                {selectedUnit.followId && (
                    <p className="mt-1 mb-0 text-[11px] leading-[1.45] text-faint">
                        {guide ? (
                            <>
                                Keeping station on <span className="text-text">{labelOf(guide.type, guide.slot)}</span>.
                            </>
                        ) : (
                            "Formation guide lost. Holding position."
                        )}
                    </p>
                )}

                {!!def.warheads && (
                    <div className="mt-3">
                        <div className="flex items-baseline justify-between">
                            <span className="text-[11px] font-medium text-faint">Integrity</span>
                            <b className="font-mono tabular-nums text-[11.5px] font-semibold">
                                {Math.round(selectedUnit.hp)}/{def.hp}
                            </b>
                        </div>
                        <Meter
                            frac={hpFrac}
                            fillClass={hpFrac <= 0.35 ? "bg-danger" : "bg-accent"}
                            ariaLabel="Integrity"
                            className="mt-1.5 h-[4px]"
                        />
                    </div>
                )}

                {(blurb || detailRows.length > 0) && (
                    <div className="mt-2">
                        <button
                            type="button"
                            className="db-ibtn sm ghost w-full px-0"
                            aria-expanded={details}
                            onClick={toggleDetails}
                        >
                            <span>Details</span>
                            <Icon name={details ? "chevron-up" : "chevron-down"} size={14} />
                        </button>
                        {details && (
                            <>
                                {blurb && <p className="text-[11.5px] leading-[1.5] text-dim mt-2 mb-0">{blurb}</p>}
                                {detailRows.length > 0 && <StatRows rows={detailRows} className="mt-2" />}
                            </>
                        )}
                    </div>
                )}

                {mine && def.warheads && allowedAmmo(selectedUnit.type).length > 1 && (
                    <PayloadPicker unit={selectedUnit} def={def} myNation={myNation} api={api} />
                )}

                {mine && (!!def.airSpeed || !!def.sortieKm) && <StanceButtons unit={selectedUnit} api={api} />}

                {mine && !!def.wing && (
                    <Hangar
                        unit={selectedUnit}
                        w={w}
                        myNation={myNation}
                        mySlot={mySlot}
                        api={api}
                        labelOf={labelOf}
                        teamColor={teamColor}
                        flash={flash}
                    />
                )}

                {mine && selectedUnit.type === "bunker" && <Leadership w={w} mySlot={mySlot} api={api} flash={flash} />}

                {mine && !!def.capture && (
                    <GroundCapture unit={selectedUnit} w={w} mySlot={mySlot} api={api} teamColor={teamColor} />
                )}
            </div>
        </div>
    );
}

// Hostile/Defensive engagement stance for aircraft and sortie platforms.
// Hostile auto-engages any enemy that comes within range; Defensive holds fire
// until attacked, then returns fire on the attacker. Defaults to Defensive.
function StanceButtons({unit, api}) {
    const stance = unit.stance || "defensive";
    const opts = [
        ["defensive", "Defensive", "Hold fire unless attacked, then return fire on the attacker."],
        ["hostile", "Hostile", "Engage any enemy unit, aircraft, or city that comes within range."],
    ];
    return (
        <div className="mt-3">
            <span className="db-kicker">Engagement Stance</span>
            <div className="flex gap-1.5">
                {opts.map(([k, lbl, tip]) => (
                    <button
                        key={k}
                        className={cn("db-ibtn flex-1 min-w-0", stance === k && "on")}
                        aria-pressed={stance === k}
                        title={tip}
                        onClick={() => api.setStance(unit.id, k)}
                    >
                        {lbl}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Payload picker — only your own warhead-capable platforms (silo, launcher,
// sub, orbital). Each cleared round shows its warhead icon, one-word role and
// current stock, so the picker reads as the platform's identity: a launcher
// offers the fast HGV, a silo the heavy thermo.
function PayloadPicker({unit, def, myNation, api}) {
    const loaded = unit.warhead || initialWarhead(unit.type);
    const lw = WARHEADS[loaded];
    const loadedFallout = FALLOUT.warheads.includes(loaded);
    const sig = def.signature; // the round this platform is built to deliver
    return (
        <div className="mt-3">
            <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[11px] font-medium text-faint">Payload</span>
                <span className="font-mono text-[10.5px] text-text">
                    {lw.name}
                    {sig === loaded && <span className="text-faint"> · signature</span>}
                </span>
            </div>
            <div className="flex gap-1.5">
                {allowedAmmo(unit.type).map((k) => {
                    const wh = WARHEADS[k];
                    const stock = myNation?.ammo?.[k] || 0;
                    const cur = loaded === k;
                    const empty = stock === 0;
                    const isSig = sig === k;
                    return (
                        <button
                            key={k}
                            className={cn(
                                "relative flex-1 min-w-0 flex flex-col items-center gap-[3px] py-2 px-1 border bg-transparent transition-[border-color,background,color] duration-[var(--dur-fast)] ease-out-db",
                                cur
                                    ? "border-accent bg-accent-soft text-text"
                                    : "border-line text-dim enabled:hover:border-line-2",
                                empty && !cur && "opacity-45",
                            )}
                            aria-pressed={cur}
                            aria-label={`${wh.name}: ${stock} in stock${isSig ? ", this platform's signature round" : ""}`}
                            title={`${wh.name}: ${wh.desc}${isSig ? " This platform's signature payload." : ""}${
                                FALLOUT.warheads.includes(k) ? " Leaves radioactive fallout." : ""
                            }`}
                            onClick={() => api.setWarhead(unit.id, k)}
                        >
                            {isSig && (
                                <Icon
                                    name="star"
                                    size={9}
                                    className="absolute top-[3px] right-[4px]"
                                    title="Signature payload"
                                />
                            )}
                            <UnitIcon name={WARHEAD_ICON[k]} size={20} />
                            <span className="font-mono text-[10.5px] font-semibold">{wh.short}</span>
                            <span className="text-[9.5px] text-faint">{wh.role}</span>
                            <span className={cn("font-mono tabular-nums text-[10px]", empty ? "text-red" : "text-dim")}>
                                {stock}
                            </span>
                        </button>
                    );
                })}
            </div>
            <p className="text-[10.5px] leading-[1.45] text-dim mt-1.5 mb-0">
                {lw.desc}
                {loadedFallout && <span className="text-red"> Leaves radioactive fallout.</span>}
            </p>
        </div>
    );
}

// Airbase hangar and standing patrol. Patrol wording follows the base's craft:
// fixed-wing bases fly a fighter CAP, the Army Base flies a helicopter patrol.
// Never "ship" — this game has actual naval ships, so the word is reserved for
// them.
function Hangar({unit, w, myNation, mySlot, api, labelOf, teamColor, flash}) {
    const def = UNITS[unit.type];
    const rotaryPatrol = !!UNITS[PATROL_FIGHTER[unit.type]]?.rotary;
    const craftWord = rotaryPatrol ? "Helo" : "Aircraft";
    const patrolTitle = rotaryPatrol ? "Helicopter Patrol" : "Fighter Patrol";
    const patrolTerm = rotaryPatrol ? "patrol" : "CAP";
    const hasAwacs = hangarCapOf(unit.type, "awacs") > 0;
    const cur = myNation?.prod?.current;
    const curHere = cur?.item?.forBase === unit.id ? cur : null;
    const queuedHere = (myNation?.prod?.queue || []).filter((it) => it.forBase === unit.id);
    return (
        <div className="mt-3">
            <span className="db-kicker">Hangar</span>
            <div className="flex flex-col gap-1">
                {[...new Set(def.wing)].map((at) => {
                    const cap = hangarCapOf(unit.type, at);
                    const stock = unit.hangar?.[at] ?? 0;
                    const airborne = w.units.filter((x) => x.baseId === unit.id && x.type === at && x.hp > 0).length;
                    const total = hangarCount(w, myNation, unit.id, at);
                    const full = total >= cap;
                    return (
                        <div
                            key={at}
                            className="group flex items-center gap-2 py-1.5 px-2 border border-line"
                            title={`${labelOf(at, mySlot)} · ${UNITS[at].cost} pts · ${UNITS[at].buildTime}s${
                                airborne ? ` · ${airborne} airborne` : ""
                            }`}
                        >
                            <UnitIcon name={UNIT_ICON[at]} color={teamColor(mySlot)} size={14} />
                            <span className="flex-1 min-w-0 text-[11.5px] truncate">{labelOf(at, mySlot)}</span>
                            {airborne > 0 && (
                                <span
                                    className="inline-flex items-center gap-0.5 font-mono tabular-nums text-[10px] text-text"
                                    title={`${airborne} airborne`}
                                >
                                    {airborne}
                                    <Icon name="trend-up" size={7} />
                                </span>
                            )}
                            <span className="font-mono tabular-nums text-[11px] text-dim">
                                {stock}/{cap}
                            </span>
                            {!full && (
                                <span
                                    className="inline-flex items-center gap-0.5 font-mono text-[9px] text-faint opacity-60 transition-opacity duration-[140ms] ease-out-db group-hover:opacity-100"
                                    aria-hidden="true"
                                >
                                    <Icon name="shift" size={8} />
                                    ×5
                                </span>
                            )}
                            <button
                                className="w-[22px] h-[22px] grid place-items-center text-sm leading-none text-text bg-transparent border border-line-2 transition-[background,color,border-color] duration-[var(--dur-fast)] ease-out-db enabled:hover:bg-accent-fill enabled:hover:text-accent-ink enabled:hover:border-accent-fill disabled:opacity-35 disabled:cursor-default"
                                disabled={full}
                                aria-label={
                                    full
                                        ? `${labelOf(at, mySlot)} hangar full`
                                        : `Order ${labelOf(at, mySlot)}: ${UNITS[at].cost} points, ${UNITS[at].buildTime}s. Shift-click orders five.`
                                }
                                title={
                                    full
                                        ? "The hangar is at capacity for that type."
                                        : `Order one: ${UNITS[at].cost} pts, ${UNITS[at].buildTime}s on the line. Shift-click for ×5.`
                                }
                                onClick={(e) => {
                                    // Shift-click orders five; capacity/points stop the run early.
                                    let queued = 0,
                                        err = null;
                                    for (let i = 0, n = e.shiftKey ? 5 : 1; i < n; i++) {
                                        const r = api.queueAircraft(unit.id, at);
                                        if (r.error) {
                                            err = r.error;
                                            break;
                                        }
                                        queued++;
                                    }
                                    flash(
                                        queued
                                            ? `${queued > 1 ? `${queued}× ` : ""}${labelOf(at, mySlot)} added to the production queue.`
                                            : err,
                                        queued ? "info" : "err",
                                    );
                                }}
                            >
                                +
                            </button>
                        </div>
                    );
                })}
            </div>

            {(curHere || queuedHere.length > 0) && (
                <div className="mt-2 pt-2 border-t border-hair flex flex-col gap-1.5">
                    {curHere && (
                        <>
                            <div className="flex items-center justify-between text-[11px] text-text">
                                <span>Building {labelOf(curHere.item.type, mySlot)}</span>
                                <b className="font-mono tabular-nums font-semibold">
                                    {fmtPct(curHere.progress, {suffix: true})}
                                </b>
                            </div>
                            <Meter frac={curHere.progress} fillClass="bg-accent" />
                        </>
                    )}
                    {queuedHere.length > 0 && (
                        <div className="flex items-center justify-between gap-3 text-[11px] text-dim">
                            <span>In queue</span>
                            <b className="font-mono font-semibold truncate">
                                {queuedHere.map((it) => labelOf(it.type, mySlot)).join(", ")}
                            </b>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3">
                <span className="db-kicker">{patrolTitle}</span>
                <p className="mt-0 mb-1.5 text-[11px] text-dim">
                    {(unit.patrolSize || 0) === 0
                        ? "Patrol stood down"
                        : `${unit.patrolSize}-${craftWord.toLowerCase()} ${patrolTerm}`}
                    {hasAwacs && <>{` · AWACS ${unit.awacsPatrol ? "on" : "off"}`}</>}
                </p>
                <div className="flex gap-1.5">
                    {PATROL_SIZES.map((n) => (
                        <button
                            key={n}
                            className={cn("db-ibtn sm flex-1 min-w-0 font-mono", (unit.patrolSize || 0) === n && "on")}
                            aria-pressed={(unit.patrolSize || 0) === n}
                            aria-label={
                                n === 0
                                    ? "Stand patrol down"
                                    : `Keep a ${n}-${craftWord.toLowerCase()} patrol on station`
                            }
                            title={
                                n === 0 ? "Stand the patrol down." : `Keep ${n} ${craftWord.toLowerCase()}s on station.`
                            }
                            onClick={() => api.setPatrolSize(unit.id, n)}
                        >
                            {n === 0 ? "Off" : `×${n}`}
                        </button>
                    ))}
                </div>
                {hasAwacs && (
                    <button
                        className={cn("db-ibtn w-full mt-1.5", unit.awacsPatrol && "on")}
                        aria-pressed={!!unit.awacsPatrol}
                        disabled={
                            !unit.awacsPatrol &&
                            (unit.hangar?.awacs ?? 0) === 0 &&
                            w.units.filter((x) => x.baseId === unit.id && x.type === "awacs" && x.hp > 0).length === 0
                        }
                        title={
                            (unit.hangar?.awacs ?? 0) === 0
                                ? "No AWACS available. Order one above."
                                : "A wide surveillance orbit over the base."
                        }
                        onClick={() => api.setAwacsPatrol(unit.id)}
                    >
                        {unit.awacsPatrol ? "AWACS Patrol · On" : "AWACS Patrol · Off"}
                    </button>
                )}
            </div>
        </div>
    );
}

// The bunker's leadership airlift: where the nation's command currently sits,
// and the two orders that move it.
function Leadership({w, mySlot, api, flash}) {
    const lead = leadershipStatus(w, mySlot);
    if (!lead) return null;
    const leadPct = (v) => shareOfPct(v, lead.total || 1);
    const sheltering = lead.mode === "shelter";
    const releasing = lead.mode === "release";
    const act = (fn) => {
        const r = fn();
        if (r?.error) flash(r.error, "err");
    };
    return (
        <div className="mt-3">
            <span className="db-kicker">National Leadership</span>
            <StatRows
                rows={[
                    ["Surviving", `${lead.pct}%`, lead.exposed ? "text-red" : undefined],
                    ["Sheltered", `${leadPct(lead.sheltered)}%`],
                    ["In Cities", `${leadPct(lead.atCity)}%`],
                    ["In Transit", `${leadPct(lead.inTransit)}%`],
                ]}
            />
            <div className="flex gap-1.5 mt-2.5">
                <button
                    className={cn("db-ibtn flex-1 min-w-0", sheltering && "on")}
                    disabled={!lead.exposed || sheltering || !lead.hasAirstrip}
                    title={
                        !lead.hasAirstrip
                            ? "Build an Airstrip to fly the evacuation."
                            : !lead.exposed
                              ? "No leaders are exposed in your cities."
                              : "Airlift exposed leaders into the bunker."
                    }
                    onClick={() => act(api.shelterLeadership)}
                >
                    {sheltering ? "Sheltering…" : "Shelter"}
                </button>
                <button
                    className={cn("db-ibtn flex-1 min-w-0", releasing && "on")}
                    disabled={lead.sheltered <= 0 || releasing || !lead.hasAirstrip}
                    title={
                        !lead.hasAirstrip
                            ? "Build an Airstrip to fly them back out."
                            : lead.sheltered <= 0
                              ? "No leadership is sheltered."
                              : "Fly sheltered leaders back out to your cities."
                    }
                    onClick={() => act(api.releaseLeadership)}
                >
                    {releasing ? "Releasing…" : "Release"}
                </button>
            </div>
            <p className="mt-2 mb-0 text-[11px] leading-[1.45] text-faint">
                Immune to all fire except a <span className="text-text">direct Thermonuclear strike</span>. Enemy
                infantry that capture the bunker decapitate you outright.
            </p>
        </div>
    );
}

// Ground capture: the nearest city this unit is close enough to seize. An
// at-war enemy city is CAPTURED (holding flips its state; assaulting it drives
// the flip CAPTURE.assaultMult times faster). A bordering passive NEUTRAL city
// is ANNEXED instead — no war, just hold it — so ground troops are also how you
// grow into unclaimed territory.
function GroundCapture({unit, w, mySlot, api, teamColor}) {
    let city = null,
        best = Infinity,
        annex = false;
    for (const c of w.cities) {
        if (!c.alive || c.slot === unit.slot) continue;
        const isAnnex = !atWar(w, unit.slot, c.slot) && annexableBySlot(w, unit.slot, c, NEUTRAL.annexBorderKm);
        if (!atWar(w, unit.slot, c.slot) && !isAnnex) continue;
        const d = haversine(unit.lng, unit.lat, c.lng, c.lat);
        if (d <= CAPTURE.holdKm && d < best) {
            best = d;
            city = c;
            annex = isAnnex;
        }
    }
    if (!city)
        return (
            <div className="mt-3">
                <span className="db-kicker">Ground Capture</span>
                <p className="m-0 text-[11px] leading-[1.45] text-dim">
                    Move within {CAPTURE.holdKm} km of an enemy city to take its state, or a bordering neutral city to
                    annex it. Clear any garrison first. A nearby defender freezes it.
                </p>
            </div>
        );
    const holding = city.capture && city.capture.slot === unit.slot;
    const pct = fmtPct(holding ? city.capture.progress : 0);
    const assaulting = unit.targetId === city.id;
    return (
        <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-faint">
                    {annex ? "Annexing" : "Capturing"} {city.state || city.name}
                </span>
                <b className="font-mono tabular-nums text-[11.5px] font-semibold">{pct}%</b>
            </div>
            <Meter
                frac={holding ? city.capture.progress : 0}
                color={teamColor(mySlot)}
                ariaLabel={annex ? "Annexation progress" : "Capture progress"}
                className="mb-2"
            />
            {annex ? (
                <p className="m-0 text-[11px] leading-[1.45] text-dim">
                    Hold this neutral city to annex its state, and its land becomes yours to build on. You don't need to
                    assault it; neutrals don't resist.
                </p>
            ) : (
                <button
                    className={cn("db-ibtn w-full", assaulting && "on")}
                    aria-pressed={assaulting}
                    title={
                        assaulting
                            ? "Ease off the assault. The capture continues at the normal hold pace."
                            : `Storm ${city.name}: capture roughly ${CAPTURE.assaultMult}× faster while your troops press the assault.`
                    }
                    onClick={() => api.commandAttack(unit.id, assaulting ? null : city.id)}
                >
                    {assaulting ? "Assaulting · Ease Off" : "Assault City"}
                </button>
            )}
        </div>
    );
}
