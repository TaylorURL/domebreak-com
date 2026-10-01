import {useEffect, useMemo, useState} from "react";
import {
    armamentOf,
    atWar,
    isAttacker,
    liveTargetCounts,
    planAttackerTypeOptions,
    prodCount,
    solvePlan,
    suggestEngagementKm,
    UNIT_ICON,
    UNITS,
    unitLabel,
} from "../../game/engine.js";
import {BATTLE_PLAN, colorForSlot} from "../../game/data/constants.js";
import {DrawerScreen} from "./ScreenFrame.jsx";
import Flag from "../common/Flag.jsx";
import Icon from "../common/Icon.jsx";
import UnitIcon from "../common/UnitIcon.jsx";
import {cn} from "../lib/cn.js";
import {button, miniButton} from "../lib/variants.js";
import {cmpStr, countBy} from "../../lib/iter.js";
import {fmtKm, plural, rangeFill} from "../lib/format.js";

// Plan — the battle planning console in the dock's drawer. The player authors
// attack plans by picking attacker unit TYPES → target CATEGORIES (type → type)
// rather than clicking individual units on the map. Presentation only: it reads
// the pure solver for live status and edits plan intent through the
// useBattlePlans handlers (`bp`); the reconciler turns intent into real orders.
//
// The world is mutated in place; the memos below derive from w keyed on w.time
// (the tick counter) — a trigger exhaustive-deps can't model, so it's off here.
/* eslint-disable react-hooks/exhaustive-deps */

// One row of the drawer's pick lists: a box, a label, and a figure at the end.
function CheckRow({on, onClick, title, children, tail}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            role="checkbox"
            aria-checked={on}
            className={cn(
                "flex items-center gap-[10px] w-full px-[10px] py-2 border text-left transition-[border-color,background-color] duration-[var(--dur-fast)] ease-out-db",
                on ? "border-accent bg-accent-soft" : "border-line hover:border-line-2",
            )}
        >
            <span
                className={cn(
                    "flex-none w-[15px] h-[15px] grid place-items-center border",
                    on ? "border-accent text-text" : "border-line-2 text-transparent",
                )}
                aria-hidden="true"
            >
                <Icon name="check" size={11} strokeWidth={2.4} />
            </span>
            {children}
            {tail}
        </button>
    );
}

// A titled block inside the drawer body.
function Section({title, action, children}) {
    return (
        <section className="px-4 py-3 border-b border-line">
            <div className="flex items-center gap-2 mb-2">
                <h4 className="db-sec m-0">{title}</h4>
                {action && <span className="ml-auto">{action}</span>}
            </div>
            {children}
        </section>
    );
}

export default function BattlePlanScreen({world: w, mySlot, bp, onClose}) {
    const {plans, active, activeId, setActiveId} = bp;

    // My live offensive platforms, tallied by type — the ×N figure per option.
    const typeCounts = useMemo(() => {
        const live = w.units.filter((u) => u.slot === mySlot && u.hp > 0 && isAttacker(UNITS[u.type]));
        return Object.fromEntries(countBy(live, (u) => u.type));
    }, [w.units, w.time, mySlot]);
    // The attacker options — everything the nation could field (owned, on the
    // production line, or buildable now), not just what it currently owns, so a
    // plan can be drawn up around platforms still being built.
    const offenseTypes = useMemo(() => planAttackerTypeOptions(w, mySlot, plans), [w.units, w.time, mySlot, plans]);
    // type -> the plan that currently commands it (attacker types are exclusive).
    const ownerOfType = useMemo(() => {
        const m = new Map();
        for (const p of plans) for (const t of p.attackerTypes) m.set(t, p);
        return m;
    }, [plans]);

    // The enemy powers a plan may be scoped to: every ACTIVE (participating)
    // nation but me. Neutrals never appear — they can't be warred or struck.
    // Each carries whether I'm at war with it so the picker can flag live vs.
    // pre-planned targets.
    const enemyNations = useMemo(
        () =>
            w.nations
                .filter((n) => n.active !== false && n.slot !== mySlot)
                .map((n) => ({
                    slot: n.slot,
                    name: n.name,
                    iso: n.iso,
                    color: n.color || colorForSlot(n.slot),
                    war: atWar(w, mySlot, n.slot),
                }))
                .sort((a, b) => b.war - a.war || cmpStr((n) => n.name)(a, b)),
        [w.nations, w.time, mySlot],
    );

    // Live solve for the active plan — drives the status readout and the
    // arm/execute gating.
    const solved = useMemo(() => (active ? solvePlan(w, active, mySlot) : null), [w, mySlot, active]);
    // Live count of strikeable enemy assets per category under the plan's nation
    // scope — the ×N figures on the target picker, so a category is never chosen
    // blind.
    const liveCounts = useMemo(
        () => liveTargetCounts(w, mySlot, active?.targetNations),
        [w, w.time, mySlot, active?.targetNations],
    );
    // The tightest engagement dial that still reaches every hardware-reachable
    // target, for the "Fit" shortcut. Null (button hidden) when there's nothing
    // to fit to or the dial is already at or under the suggestion.
    const fitKm = useMemo(() => (active ? suggestEngagementKm(w, active, mySlot) : null), [w, w.time, active, mySlot]);
    // Munitions readiness: for a firing plan, do we hold (or have on the line)
    // the warheads its assigned shots want? `short` is the deficit summed across
    // payloads.
    const myNation = w.nations.find((x) => x.slot === mySlot);
    const munitions = useMemo(() => {
        if (!solved || !myNation) return null;
        let want = 0,
            have = 0;
        for (const [wh, shots] of Object.entries(solved.ammoWanted)) {
            want += shots;
            have += Math.min(shots, (myNation.ammo?.[wh] || 0) + prodCount(myNation, "ammo", wh));
        }
        return {want, have, short: Math.max(0, want - have)};
    }, [solved, myNation, w.time]);
    const armed = !!active?.armed;
    // Two-step delete: the first click arms confirmation, the second removes the
    // plan. Auto-resets after a moment, and whenever the active plan changes.
    const [confirmDel, setConfirmDel] = useState(false);
    useEffect(() => setConfirmDel(false), [activeId]);
    useEffect(() => {
        if (!confirmDel) return;
        const t = setTimeout(() => setConfirmDel(false), 3000);
        return () => clearTimeout(t);
    }, [confirmDel]);
    // A plan can be ARMED as soon as it's fully drawn up (attackers + targets
    // chosen) — no war required. It sits standing by and engages the moment a
    // valid target exists.
    const canArm = !!active && active.attackerTypes.length > 0 && active.targetTypes.length > 0;
    // A ONE-SHOT strike still needs something to fire at right now.
    const canFire = !!solved && solved.firing > 0;
    // Explains what the plan is (or isn't) doing under the Arm/Execute control.
    const reason =
        !active || !solved
            ? null
            : active.attackerTypes.length === 0
              ? "Pick one or more attacker unit types."
              : active.targetTypes.length === 0
                ? "Pick one or more target types."
                : solved.attackerCount === 0
                  ? "You own no units of the selected types yet. Arm it now and it fires once you build them."
                  : solved.targetsLive === 0
                    ? active.mode === "standing"
                        ? "No active wars yet. Arm this plan and it engages the moment you go to war."
                        : "No active wars yet. A one-shot strike needs a nation you're at war with."
                    : solved.firing === 0
                      ? "No attackers in range. Widen the engagement range or choose nearer targets."
                      : null;
    const armedCount = plans.filter((p) => p.armed).length;

    return (
        <DrawerScreen
            title="Plan"
            labelledBy="db-drawer-plan"
            caption={
                <>
                    <b>{plans.length}</b> {plural(plans.length, "plan")} · <b>{armedCount}</b> armed
                </>
            }
            onClose={onClose}
            tabs={
                plans.length > 0 ? (
                    <div className="db-tabs flex-none" role="tablist" aria-label="Attack plans">
                        {plans.map((p) => (
                            <button
                                key={p.id}
                                role="tab"
                                aria-selected={p.id === activeId}
                                onClick={() => setActiveId(p.id)}
                                className="db-tab flex items-center gap-[6px]"
                            >
                                <span className="w-[7px] h-[7px] flex-none" style={{background: p.color}} />
                                <span className="max-w-[110px] overflow-hidden text-ellipsis">{p.name}</span>
                                {p.armed && <i className="db-led db-led-live" title="Armed" />}
                            </button>
                        ))}
                        <button
                            className={cn(miniButton(), "self-center ml-2 mb-[6px] flex-none")}
                            onClick={bp.addPlan}
                            disabled={plans.length >= BATTLE_PLAN.maxPlans}
                            title="New plan"
                        >
                            <Icon name="plus" size={11} />
                            Plan
                        </button>
                    </div>
                ) : null
            }
        >
            {plans.length === 0 ? (
                <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
                    <Icon name="target" size={34} className="text-dim" strokeWidth={1.4} />
                    <p className="m-0 text-dim text-[12.5px] leading-[1.5]">
                        Draw up a plan of attack: pick which of your platforms fire, choose what they hit, set the
                        reach, and arm it. You never have to hunt for units on the map.
                    </p>
                    <button className={button({variant: "primary"})} onClick={bp.addPlan}>
                        New Plan
                    </button>
                </div>
            ) : (
                active && (
                    <>
                        <div className="flex flex-col gap-2 px-4 py-3 border-b border-line">
                            <input
                                value={active.name}
                                onChange={(e) => bp.renamePlan(active.id, e.target.value)}
                                className="w-full bg-sunk border border-line text-text px-3 py-2 text-[13px] outline-none focus:border-text"
                                aria-label="Plan name"
                            />
                            <div className="flex items-center gap-[6px]">
                                {[
                                    ["standing", "Standing"],
                                    ["oneshot", "One-shot"],
                                ].map(([m, lbl]) => (
                                    <button
                                        key={m}
                                        onClick={() => bp.setPlanMode(active.id, m)}
                                        className={cn(
                                            button({variant: active.mode === m ? "primary" : "default"}),
                                            "flex-1 min-h-7 px-2 text-[12px]",
                                        )}
                                        aria-pressed={active.mode === m}
                                    >
                                        {lbl}
                                    </button>
                                ))}
                                <button
                                    className={cn(miniButton(), "flex-none")}
                                    onClick={() => bp.duplicatePlan(active.id)}
                                    title="Duplicate plan"
                                >
                                    Copy
                                </button>
                                <button
                                    className={cn(miniButton({danger: true}), "flex-none")}
                                    onClick={() => (confirmDel ? bp.removePlan(active.id) : setConfirmDel(true))}
                                    title={confirmDel ? "Click again to delete" : "Delete plan"}
                                    aria-label={confirmDel ? "Confirm delete plan" : "Delete plan"}
                                >
                                    {confirmDel ? "Delete?" : <Icon name="close" size={12} />}
                                </button>
                            </div>
                        </div>

                        <Section
                            title="Attackers"
                            action={
                                active.attackerTypes.length > 0 && (
                                    <button
                                        onClick={() => bp.clearAttackerTypes(active.id)}
                                        className={cn(miniButton(), "px-2 py-0 text-[10.5px]")}
                                    >
                                        Clear
                                    </button>
                                )
                            }
                        >
                            {offenseTypes.length === 0 ? (
                                <p className="m-0 py-2 text-[11.5px] text-faint">
                                    No offensive platforms yet. Build silos, launchers, or ground forces.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-[6px]">
                                    {offenseTypes.map((type) => {
                                        const owner = ownerOfType.get(type);
                                        const mine = owner?.id === active.id;
                                        const elsewhere = owner && !mine;
                                        return (
                                            <CheckRow
                                                key={type}
                                                on={mine}
                                                onClick={() => bp.toggleAttackerType(active.id, type)}
                                                title={elsewhere ? `In ${owner.name}, moves here` : undefined}
                                                tail={
                                                    <span className="flex-none font-mono text-[11.5px] tabular-nums text-dim">
                                                        ×{typeCounts[type] || 0}
                                                    </span>
                                                }
                                            >
                                                <UnitIcon
                                                    name={UNIT_ICON[type]}
                                                    size={16}
                                                    className="flex-none text-dim"
                                                />
                                                <span className="flex flex-col leading-[1.2] min-w-0 flex-1">
                                                    <span className="text-[12.5px] text-text truncate">
                                                        {unitLabel(type)}
                                                    </span>
                                                    {armamentOf(type) && (
                                                        <span className="text-[10px] text-faint truncate">
                                                            {armamentOf(type)}
                                                        </span>
                                                    )}
                                                </span>
                                            </CheckRow>
                                        );
                                    })}
                                </div>
                            )}
                        </Section>

                        <Section
                            title="Target Nations"
                            action={
                                active.targetNations.length > 0 && (
                                    <button
                                        onClick={() => bp.clearTargetNations(active.id)}
                                        className={cn(miniButton(), "px-2 py-0 text-[10.5px]")}
                                    >
                                        Any
                                    </button>
                                )
                            }
                        >
                            {enemyNations.length === 0 ? (
                                <p className="m-0 py-2 text-[11.5px] text-faint">No rival powers in this match.</p>
                            ) : (
                                <div className="flex flex-wrap gap-[6px]">
                                    {enemyNations.map((n) => {
                                        const on = active.targetNations.includes(n.slot);
                                        return (
                                            <button
                                                key={n.slot}
                                                onClick={() => bp.toggleTargetNation(active.id, n.slot)}
                                                title={
                                                    n.war
                                                        ? "At war, live target"
                                                        : "At peace. This plan engages it if war breaks out"
                                                }
                                                className={cn(
                                                    "flex items-center gap-[6px] px-2 py-1 border text-[11.5px] font-medium transition-[border-color,background-color] duration-[var(--dur-fast)] ease-out-db",
                                                    on
                                                        ? "border-accent bg-accent-soft text-text"
                                                        : "border-line text-dim hover:border-line-2 hover:text-text",
                                                )}
                                            >
                                                <span
                                                    className="flex-none w-[18px] h-[12px] grid place-items-center overflow-hidden border [&>*]:w-full [&>*]:h-full [&>*]:object-cover"
                                                    style={{borderColor: n.color}}
                                                >
                                                    <Flag iso={n.iso} />
                                                </span>
                                                <span className="whitespace-nowrap max-w-[104px] overflow-hidden text-ellipsis">
                                                    {n.name}
                                                </span>
                                                {n.war && <i className="db-led db-led-live" title="At war" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="mt-2 mb-0 text-[10.5px] text-faint leading-[1.4]">
                                {active.targetNations.length === 0
                                    ? "Any nation you're at war with. Pick specific powers to strike only them; neutrals are never targeted."
                                    : "Only the selected powers are struck, and only once you're at war with them."}
                            </p>
                        </Section>

                        <Section
                            title="Target Types"
                            action={
                                active.targetTypes.length > 0 && (
                                    <button
                                        onClick={() => bp.clearTargetTypes(active.id)}
                                        className={cn(miniButton(), "px-2 py-0 text-[10.5px]")}
                                    >
                                        Clear
                                    </button>
                                )
                            }
                        >
                            <div className="flex flex-col gap-[6px]">
                                {BATTLE_PLAN.targetCategories.map((c) => {
                                    const on = active.targetTypes.includes(c.id);
                                    const live = liveCounts[c.id] || 0;
                                    return (
                                        <CheckRow
                                            key={c.id}
                                            on={on}
                                            onClick={() => bp.toggleTargetType(active.id, c.id)}
                                            title={
                                                live > 0
                                                    ? `${live} live under this plan's target scope right now`
                                                    : "None live under this plan's target scope yet"
                                            }
                                            tail={
                                                <span
                                                    className={cn(
                                                        "flex-none font-mono text-[11.5px] tabular-nums",
                                                        live > 0 ? "text-dim" : "text-faint",
                                                    )}
                                                >
                                                    ×{live}
                                                </span>
                                            }
                                        >
                                            <span className="flex-1 min-w-0 text-[12.5px] text-text truncate">
                                                {c.label}
                                            </span>
                                        </CheckRow>
                                    );
                                })}
                            </div>
                        </Section>

                        <Section
                            title="Engagement Range"
                            action={
                                <span className="flex items-center gap-2">
                                    {fitKm != null && fitKm !== active.engagementKm && (
                                        <button
                                            onClick={() => bp.patchPlan(active.id, {engagementKm: fitKm})}
                                            title={`Set the dial to ${fmtKm(fitKm)}, the tightest range that still reaches every target this plan can hit`}
                                            className={cn(miniButton(), "px-2 py-0 text-[10.5px]")}
                                        >
                                            Fit
                                        </button>
                                    )}
                                    <span className="font-mono text-[12px] tabular-nums text-text">
                                        {fmtKm(active.engagementKm)}
                                    </span>
                                </span>
                            }
                        >
                            <input
                                type="range"
                                min={BATTLE_PLAN.minEngagementKm}
                                max={BATTLE_PLAN.maxEngagementKm}
                                step={BATTLE_PLAN.engagementStepKm}
                                value={active.engagementKm}
                                onChange={(e) => bp.patchPlan(active.id, {engagementKm: Number(e.target.value)})}
                                className="db-range"
                                style={rangeFill(
                                    active.engagementKm,
                                    BATTLE_PLAN.minEngagementKm,
                                    BATTLE_PLAN.maxEngagementKm,
                                )}
                                aria-label="Engagement range"
                            />
                            <p className="mt-1 mb-0 text-[10.5px] text-faint leading-[1.4]">
                                Attackers hold fire past this range, up to each platform's own reach.
                            </p>
                        </Section>

                        <Section title="Rules of Engagement">
                            <div className="flex flex-col gap-[6px]">
                                <CheckRow
                                    on={active.overkill}
                                    onClick={() => bp.patchPlan(active.id, {overkill: !active.overkill})}
                                    title="Keep stacking fire on a target past what kills it"
                                >
                                    <span className="flex-1 min-w-0 text-[12.5px] text-text">Overkill</span>
                                </CheckRow>
                                <CheckRow
                                    on={active.autoBuild}
                                    onClick={() => bp.patchPlan(active.id, {autoBuild: !active.autoBuild})}
                                    title="Keep your warhead stock topped up for this plan"
                                >
                                    <span className="flex-1 min-w-0 text-[12.5px] text-text">Auto-build Munitions</span>
                                </CheckRow>
                            </div>
                        </Section>

                        {solved && (
                            <div className="flex flex-col gap-2 px-4 py-3">
                                <div className="text-[11.5px] text-dim leading-[1.5]">
                                    <span className="inline-flex items-center gap-[6px] font-mono text-text">
                                        <i
                                            className={cn("db-led", solved.firing > 0 ? "db-led-ok" : "text-faint")}
                                            aria-hidden="true"
                                        />
                                        {solved.firing} firing
                                    </span>
                                    {solved.idle.length > 0 && (
                                        <span className="text-faint"> · {solved.idle.length} idle</span>
                                    )}
                                    {solved.outOfRange.length > 0 && (
                                        <span className="text-faint"> · {solved.outOfRange.length} out of range</span>
                                    )}
                                    <span className="text-faint">
                                        {" "}
                                        · {solved.targetsCovered}/{solved.targetsLive} targets covered
                                    </span>
                                    {solved.volleysToClear != null && (
                                        <span className="text-faint">
                                            {" "}
                                            · ~{solved.volleysToClear}{" "}
                                            {solved.volleysToClear === 1 ? "volley" : "volleys"} to clear
                                        </span>
                                    )}
                                </div>
                                {active.mode === "standing" ? (
                                    <button
                                        onClick={() => bp.patchPlan(active.id, {armed: !armed})}
                                        disabled={!canArm && !armed}
                                        className={cn(button({variant: armed ? "danger" : "primary"}), "w-full")}
                                    >
                                        <Icon name={armed ? "stop" : "play"} size={13} />
                                        {armed ? "Disarm" : "Arm Plan"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => bp.executePlan(active.id)}
                                        disabled={!canFire}
                                        className={cn(button({variant: "primary"}), "w-full")}
                                    >
                                        <Icon name="bolt" size={13} />
                                        Execute Strike
                                    </button>
                                )}
                                {armed
                                    ? solved.firing === 0 && (
                                          <p className="m-0 text-[11px] text-dim leading-[1.4]">
                                              Armed and standing by. It engages automatically once a valid target is in
                                              play.
                                          </p>
                                      )
                                    : reason && <p className="m-0 text-[11px] text-dim leading-[1.4]">{reason}</p>}
                                {/* Munitions readiness — only meaningful once a warhead-hungry
                                    plan is firing. A shortfall warns unless Auto-build is
                                    already topping it up. */}
                                {munitions &&
                                    munitions.want > 0 &&
                                    (munitions.short > 0 ? (
                                        <p className="m-0 text-[11px] text-text leading-[1.4]">
                                            Munitions: short {munitions.short} of {munitions.want} warheads
                                            {active.autoBuild
                                                ? ". Auto-build is topping up."
                                                : ". Turn on Auto-build or produce them."}
                                        </p>
                                    ) : (
                                        <p className="m-0 text-[11px] text-good leading-[1.4]">
                                            Munitions ready, {munitions.want} warheads on hand.
                                        </p>
                                    ))}
                            </div>
                        )}
                    </>
                )
            )}
        </DrawerScreen>
    );
}
