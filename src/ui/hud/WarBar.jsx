import {atWar} from "../../game/engine.js";
import Flag from "../common/Flag.jsx";
import Icon from "../common/Icon.jsx";
import {cn} from "../lib/cn.js";

// One labelled standing readout — a header chip (icon + lamp + tone-colored label)
// and the ringed flags of every nation in that standing. Shared by the war and ally
// groups so both read identically apart from color and copy. Each flag is a
// button that opens the country's dossier (declare war / manage alliance).
//
// The war group's hairline pulses to danger and back for as long as a war is open,
// which is the one standing alarm in the HUD; the ally group sits quiet.
function StandingGroup({icon, label, tone, verb, nations, onOpenCountry}) {
    const war = tone === "war";
    const ring = war ? "shadow-[0_0_0_1.5px_var(--red)]" : "shadow-[0_0_0_1.5px_var(--ally)]";
    return (
        <div
            className={cn(
                "db-hud-panel relative flex flex-row flex-wrap items-center justify-end gap-[7px] max-w-[440px] px-[10px] py-[7px] [--db-tab:0px]",
                war && "db-war-pulse",
            )}
            role="group"
            aria-label={`${label}, ${nations.length} ${nations.length === 1 ? "nation" : "nations"}`}
        >
            <span
                className={cn(
                    "flex items-center gap-[6px] pr-[8px] border-r border-line-soft",
                    war ? "text-red" : "text-[color:var(--ally)]",
                )}
            >
                <Icon name={icon} size={14} />
                <span className="db-led" style={{color: war ? "var(--red)" : "var(--ally)"}} aria-hidden="true" />
                <span className="font-mono text-[9px] font-semibold tracking-[0.2em] uppercase">{label}</span>
            </span>
            {nations.map((n) => (
                <button
                    key={n.slot}
                    type="button"
                    className="grid place-items-center text-[18px] leading-none rounded-[2px] transition-transform duration-[var(--dur-fast)] ease-out-db hover:scale-110 active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--accent)]"
                    title={`${verb} ${n.name}, open dossier`}
                    aria-label={`Open ${n.name} dossier`}
                    onClick={() => onOpenCountry?.(n.slot)}
                >
                    <Flag iso={n.iso} className={ring} />
                </button>
            ))}
        </div>
    );
}

// Bottom-right diplomacy readout: an at-a-glance list of the player's current
// alliances and active wars, each in its own labelled group so allies read as
// allied (blue) and never get lumped under the war strip. Allies sit above the
// wars. Renders nothing while the player has no alliances and no wars, so it
// only appears once a standing exists.
export default function WarBar({world, mySlot, onOpenCountry}) {
    const me = world.nations.find((n) => n.slot === mySlot);
    const enemies = world.nations.filter((n) => n.slot !== mySlot && n.alive && atWar(world, mySlot, n.slot));
    const allies = world.nations.filter((n) => n.slot !== mySlot && n.alive && me?.relations[n.slot] === "ally");
    if (!enemies.length && !allies.length) return null;
    return (
        <div className="flex flex-col items-end gap-[6px]">
            {allies.length > 0 && (
                <StandingGroup
                    icon="handshake"
                    label="Allies"
                    tone="ally"
                    verb="Allied with"
                    nations={allies}
                    onOpenCountry={onOpenCountry}
                />
            )}
            {enemies.length > 0 && (
                <StandingGroup
                    icon="swords"
                    label="At War"
                    tone="war"
                    verb="At war with"
                    nations={enemies}
                    onOpenCountry={onOpenCountry}
                />
            )}
        </div>
    );
}
