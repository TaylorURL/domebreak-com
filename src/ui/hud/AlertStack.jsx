import {useEffect, useRef, useState} from "react";
import {atWar, leadershipStatus} from "../../game/engine.js";
import {DIPLOMACY} from "../../game/data/constants.js";
import Flag from "../common/Flag.jsx";
import Icon from "../common/Icon.jsx";
import {cn} from "../lib/cn.js";
import {button} from "../lib/variants.js";
import {plural} from "../lib/format.js";

// How long the end-of-grace card stays up before it retires itself.
const GRACE_END_MS = 6000;
// The stack never grows past three cards; anything further down waits.
const MAX_CARDS = 3;

// hh:mm:ss countdown, fixed width so the seconds tick without the label moving.
function formatHms(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

// "Brazil, Mexico and Spain" — the enemy roll, capped so a twelve-power war
// still reads in one line.
function nameList(names) {
    if (names.length <= 3) {
        if (names.length <= 1) return names[0] || "";
        return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    }
    return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more powers`;
}

// One alert: a 3px edge rule, a 24px glyph, the title and body, and the single
// button that answers it. The rule is red on a danger alert and the accent on
// every other. The button is the outline one, and the blue primary only where
// it is the move a non-danger alert recommends and that move is open now; a
// move the player cannot make yet stays an outline rather than a primary with
// its fill gone.
function Alert({tone, icon, title, body, action, onDismiss, dismissLabel}) {
    return (
        <div
            className="relative flex items-center gap-[14px] pl-[18px] pr-[14px] py-3 bg-panel border border-line backdrop-blur-[10px] pointer-events-auto motion-safe:animate-[dbPop_200ms_var(--ease-out)]"
            role={tone === "danger" ? "alert" : "status"}
            aria-live={tone === "danger" ? "assertive" : "polite"}
        >
            <i
                className={cn(
                    "absolute -left-px -top-px -bottom-px w-[3px]",
                    tone === "danger" ? "bg-red" : "bg-accent",
                )}
                aria-hidden="true"
            />
            <Icon name={icon} size={24} className={cn("flex-none", tone === "danger" ? "text-red" : "text-text")} />
            <div className="flex-1 min-w-0">
                <b className="block text-[13.5px] font-semibold leading-tight">{title}</b>
                <span className="block mt-px text-[12.5px] leading-snug text-dim">{body}</span>
            </div>
            {action}
            <button
                type="button"
                className="flex-none grid place-items-center w-6 h-6 text-faint transition-colors duration-[var(--dur-fast)] hover:text-text"
                onClick={onDismiss}
                title={dismissLabel}
                aria-label={dismissLabel}
            >
                <Icon name="close" size={13} />
            </button>
        </div>
    );
}

// The alert stack, centred under the strip over the map: the two or three things
// that need answering right now, each with the control that answers it. A card
// leaves when its condition ends or when the player dismisses it.
export default function AlertStack({world, api, mySlot, onOpenPanel, onOpenCountry, flash}) {
    const [dismissed, setDismissed] = useState({});
    const drop = (key) => setDismissed((d) => ({...d, [key]: true}));

    const lead = leadershipStatus(world, mySlot);
    const me = world.nations.find((n) => n.slot === mySlot);
    const enemies = world.nations.filter((n) => n.slot !== mySlot && n.alive && atWar(world, mySlot, n.slot));
    const grace = world?.rules?.playerGraceSec ?? DIPLOMACY.playerGraceSec;
    const graceLeft = Math.max(0, grace - (world?.time ?? 0));
    const graceOn = grace > 0 && graceLeft > 0;

    // The end-of-grace notice fires once per match, the moment the window closes.
    const [graceEnded, setGraceEnded] = useState(false);
    const wasGrace = useRef(graceOn);
    const firedGrace = useRef(false);
    useEffect(() => {
        if (graceOn) {
            wasGrace.current = true;
            return;
        }
        if (!wasGrace.current || firedGrace.current || grace <= 0) return;
        firedGrace.current = true;
        setGraceEnded(true);
        const t = setTimeout(() => setGraceEnded(false), GRACE_END_MS);
        return () => clearTimeout(t);
    }, [graceOn, grace]);

    // Fire a leadership order and surface whatever the engine rejects it with.
    const act = (fn) => {
        const r = fn();
        if (r?.error) flash?.(r.error, "err");
    };

    const cards = [];

    // War. Keyed on the enemy roll, so a fresh declaration raises the card again
    // after the last one was dismissed.
    const warKey = `war:${enemies
        .map((n) => n.slot)
        .sort((a, b) => a - b)
        .join(",")}`;
    if (enemies.length && !dismissed[warKey]) {
        cards.push(
            <Alert
                key={warKey}
                tone="danger"
                icon="alert"
                title="War declared"
                body={
                    <>
                        {nameList(enemies.map((n) => n.name))}{" "}
                        {enemies.length === 1 ? "is at war with you." : "are at war with you."}
                        <span className="inline-flex align-middle gap-1 ml-[6px]">
                            {enemies.slice(0, 6).map((n) => (
                                <button
                                    type="button"
                                    key={n.slot}
                                    className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)]"
                                    onClick={() => onOpenCountry?.(n.slot)}
                                    title={`Open the ${n.name} dossier`}
                                    aria-label={`Open the ${n.name} dossier`}
                                >
                                    <Flag iso={n.iso} className="w-[18px] h-[12px] block" />
                                </button>
                            ))}
                        </span>
                    </>
                }
                action={
                    <button
                        type="button"
                        className={cn(button(), "flex-none h-7 px-[10px] text-[12px]")}
                        onClick={() => onOpenPanel?.("diplomacy")}
                    >
                        War Board
                    </button>
                }
                dismissLabel="Dismiss the war alert"
                onDismiss={() => drop(warKey)}
            />,
        );
    }

    // Leadership. Exposed during a war is the alarm; sheltered in peacetime is
    // the standing offer to bring them home.
    if (lead) {
        const sheltering = lead.mode === "shelter";
        const releasing = lead.mode === "release";
        const exposed = lead.atWar && lead.exposed && !sheltering;
        const homeable = !lead.atWar && lead.sheltered > 0 && !releasing;
        const where = lead.sites.length
            ? lead.sites.slice(0, 3).join(", ") +
              (lead.sites.length > 3
                  ? ` and ${lead.sites.length - 3} more ${plural(lead.sites.length - 3, "city", "cities")}`
                  : "")
            : "the field";
        const infra = !lead.hasBunker
            ? "Build a Leadership Bunker to shelter your leaders."
            : !lead.hasAirstrip
              ? "Build an Airstrip to fly the airlift."
              : null;
        const canShelter = !infra && lead.exposed;
        const leadKey = exposed ? "lead:exposed" : homeable ? "lead:home" : null;
        if (leadKey && !dismissed[leadKey]) {
            cards.push(
                <Alert
                    key={leadKey}
                    tone="warn"
                    icon="crown"
                    title={exposed ? "Leadership is exposed" : "Leadership is sheltered"}
                    body={
                        exposed
                            ? infra || `Your leaders sit in ${where}. A strike there decapitates you.`
                            : "Your leaders are buttoned up in the bunker. Release them to restore full command."
                    }
                    action={
                        exposed ? (
                            <button
                                type="button"
                                className={cn(
                                    button({variant: canShelter ? "primary" : "default"}),
                                    "flex-none h-7 px-[10px] text-[12px]",
                                )}
                                disabled={!canShelter}
                                onClick={() => act(api.shelterLeadership)}
                                title="Airlift exposed leaders into the bunker."
                            >
                                Shelter
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={cn(button(), "flex-none h-7 px-[10px] text-[12px]")}
                                disabled={!lead.hasAirstrip}
                                onClick={() => act(api.releaseLeadership)}
                                title="Fly sheltered leaders back out to your cities."
                            >
                                Release
                            </button>
                        )
                    }
                    dismissLabel="Dismiss the leadership alert"
                    onDismiss={() => drop(leadKey)}
                />,
            );
        }
    }

    // Grace: the opening ceasefire counting down, then the one notice that it is over.
    if (graceOn && !dismissed["grace"]) {
        cards.push(
            <Alert
                key="grace"
                tone="warn"
                icon="shield"
                title="Grace period"
                body={
                    <>
                        No power can declare war yet.{" "}
                        <span className="font-mono tabular-nums text-text">{formatHms(graceLeft)}</span> left to build
                        in peace.
                    </>
                }
                dismissLabel="Dismiss the grace countdown"
                onDismiss={() => drop("grace")}
            />,
        );
    } else if (graceEnded && !dismissed["grace-end"]) {
        cards.push(
            <Alert
                key="grace-end"
                tone="warn"
                icon="shield"
                title="Grace period ended"
                body="Any power can now declare war."
                dismissLabel="Dismiss the grace notice"
                onDismiss={() => drop("grace-end")}
            />,
        );
    }

    if (!cards.length || !me) return null;
    // LiveGame owns the lane this sits in — a column over the map, clear of the
    // dock, the drawer and the objective tracker — so the stack only sizes itself.
    return (
        <div className="flex flex-col gap-2 w-[560px] max-w-full" aria-label="Alerts">
            {cards.slice(0, MAX_CARDS)}
        </div>
    );
}
