// Country dossier — a full-modal deep-dive for a single power, opened from
// any flag click (Tab scoreboard, WarBar) or a right-click on the hovered
// country plaque. Shares its shell with Production / Diplomacy (ScreenFrame,
// Esc-to-close, focus trap) so it reads as another top-bar screen even
// though it's context-triggered. Presentation only — every war / peace /
// alliance action goes through the same api entry points DiplomacyScreen
// uses.
import ScreenFrame from "./ScreenFrame.jsx";
import Standing from "./Standing.jsx";
import Flag from "../common/Flag.jsx";
import {DIPLOMACY} from "../../game/data/constants.js";
import {miniButton} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import {fmtGdp, fmtPop} from "../lib/format.js";
import {useRoster} from "../lib/roster.js";
import {gdpOf, populationOf} from "../../game/engine.js";

export default function CountryInfoPopup({world, api, mySlot, online, targetSlot, players, onClose}) {
    const me = world.nations.find((n) => n.slot === mySlot);
    const n = world.nations.find((x) => x.slot === targetSlot);

    const {usernameOf, isHuman} = useRoster(players);

    if (!n) {
        return (
            <ScreenFrame title="Unknown Power" onClose={onClose}>
                <p className="text-[12.5px] text-dim">This power is no longer in the roster.</p>
            </ScreenFrame>
        );
    }

    const isMe = n.slot === mySlot;
    const neutral = n.active === false;
    const eliminated = !n.alive;
    const rel = isMe
        ? "self"
        : me?.relations[n.slot] === "war"
          ? "war"
          : me?.relations[n.slot] === "ally"
            ? "ally"
            : "peace";

    const cities = world.cities.filter((c) => c.slot === n.slot && c.alive).length;
    const forces = world.units.filter((u) => u.slot === n.slot && u.hp > 0).length;
    const pop = populationOf(world, n.slot);
    const gdp = gdpOf(world, n.slot);

    const human = isHuman(n.slot);
    const seatLabel = isMe ? "You" : human ? "Player" : "AI";
    const seatCls = isMe
        ? "bg-accent-fill border-accent-fill text-accent-ink"
        : human
          ? "text-text border-line-2"
          : "border-line text-dim";
    const commander = !isMe && human ? usernameOf.get(n.slot) || "Commander" : null;

    // Where you stand with this power, in the word and colours every screen
    // gives it (see Standing). A power out of the war says so instead.
    const standing = isMe ? "self" : neutral ? "neutral" : eliminated ? "eliminated" : rel;

    const call = (fn, ok) => {
        const r = fn();
        if (r?.error) return;
        if (ok) ok();
        onClose();
    };

    const canAct = !isMe && !neutral && !eliminated;
    const graceSec = world.rules?.playerGraceSec ?? DIPLOMACY.playerGraceSec;
    const graceActive = graceSec > 0 && (world.time ?? 0) < graceSec;

    // One title row says who this is: the flag, the name, the seat and the
    // standing, in the frame's own header, so the body below opens on the
    // figures. The flag-icons mark is drawn 4:3 at the size of its font, so the
    // font size on its holder is what sets it (an unlayered rule in that sheet
    // outranks a width utility); the holder is a flex box so the mark sits on no
    // text baseline and the hairline hugs it.
    const title = (
        <span className="flex items-center gap-[10px]">
            <span className="flex flex-none text-[18px]">
                <Flag iso={n.iso} className="border border-line-2" />
            </span>
            {n.name}
        </span>
    );
    const caption = (
        <span className="flex items-center justify-end gap-[8px] flex-wrap">
            <span
                className={cn(
                    "inline-block px-[8px] py-[2px] text-[10.5px] font-medium border whitespace-nowrap",
                    seatCls,
                )}
            >
                {seatLabel}
            </span>
            {commander && <span className="text-[12px] text-dim">{commander}</span>}
            <Standing rel={standing} className="text-[12px] font-medium" />
        </span>
    );

    return (
        <ScreenFrame title={title} caption={caption} onClose={onClose}>
            <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-[10px]">
                    <StatCell label="Cities" value={eliminated || neutral ? "—" : cities} />
                    <StatCell label="Forces" value={eliminated || neutral ? "—" : forces} />
                    <StatCell label="Population" value={eliminated || neutral ? "—" : fmtPop(pop)} />
                    <StatCell label="GDP" value={eliminated || neutral ? "—" : fmtGdp(gdp)} />
                </div>

                <div className="flex flex-col gap-[8px]">
                    <span className="pb-1.5 border-b border-hair text-[11px] font-medium text-faint">Diplomacy</span>
                    {!canAct ? (
                        <p className="text-[12px] leading-[1.5] text-dim">
                            {isMe
                                ? "This is your own power, so there is nothing to negotiate."
                                : neutral
                                  ? "A neutral power that sits out the war, start to finish."
                                  : "Eliminated. Only the dossier remains."}
                        </p>
                    ) : rel === "war" ? (
                        <div className="flex flex-wrap gap-[8px]">
                            {online ? (
                                <span className="text-[12px] text-faint">
                                    Peace terms are single-player only for now.
                                </span>
                            ) : (
                                <button
                                    className={miniButton()}
                                    aria-label={`Offer white peace to ${n.name}`}
                                    onClick={() => call(() => api.offerPeace(n.slot))}
                                >
                                    Offer Peace
                                </button>
                            )}
                        </div>
                    ) : rel === "ally" ? (
                        <div className="flex flex-wrap gap-[8px]">
                            <button
                                className={miniButton({danger: true})}
                                aria-label={`Break the alliance with ${n.name}`}
                                onClick={() => call(() => api.breakAlliance(n.slot))}
                            >
                                Break Alliance
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-[8px]">
                            <button
                                className={miniButton()}
                                aria-label={`Propose an alliance to ${n.name}`}
                                onClick={() => call(() => api.proposeAlliance(n.slot))}
                            >
                                Propose Alliance
                            </button>
                            <button
                                className={miniButton({danger: true})}
                                aria-label={`Declare war on ${n.name}`}
                                disabled={graceActive}
                                title={graceActive ? "Opening grace holds. No war can be declared yet." : undefined}
                                onClick={() => call(() => api.declareWar(n.slot))}
                            >
                                Declare War
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </ScreenFrame>
    );
}

function StatCell({label, value}) {
    return (
        <div className="flex flex-col-reverse gap-[3px] px-[14px] py-3 bg-sunk border border-line">
            <span className="text-[10.5px] text-faint">{label}</span>
            <b className="font-mono tabular-nums text-lg font-semibold leading-[1.2]">{value}</b>
        </div>
    );
}
