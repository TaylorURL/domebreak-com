// War outcome / peace-offer modal. Shows the front entry of world.warPopups —
// enqueued by the engine only when the player is a belligerent (see
// sim/warResolution.js). victory/defeat/whitepeace/refused are informational
// (Continue); offer is an interactive Accept/Decline white peace.
//
// In single-player the modal pauses the sim while it's up and resumes on close —
// unless the player had already paused manually. Online matches never pause (they
// are speed-locked), so the modal is non-blocking there. All a11y (focus trap,
// Escape, focus restore) comes from useModal.
import {nationName} from "../../game/engine.js";
import {useModal} from "../hooks/useModal.js";
import {button, overlay} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import Flag from "../common/Flag.jsx";

// Per-kind copy. `foe` is the other belligerent's display name. `danger` marks
// the cards that announce a war against you or the loss of one: those carry the
// red edge rule, and every other card carries the blue one.
function content(kind, foe) {
    switch (kind) {
        case "victory":
            return {
                title: "Victory",
                body: `${foe} has surrendered. Every territory you occupied is yours to keep.`,
            };
        case "defeat":
            return {
                title: "Defeat",
                danger: true,
                body: `You have surrendered to ${foe}. The land they occupied is lost, and your nation is shaken for a year to come.`,
            };
        case "whitepeace":
            return {
                title: "White peace",
                body: `You and ${foe} agree to end the war. All occupied territory returns to its rightful owner, so no ground changes hands.`,
            };
        case "offer":
            return {
                title: "Peace offer",
                body: `${foe} offers a white peace: end the war now, with both sides returning to their pre-war borders.`,
            };
        case "ally-offer":
            return {
                title: "Alliance proposal",
                body: `${foe} proposes a mutual-defense pact. Neither of you will make war on the other, and an attack on one draws in the other.`,
            };
        case "ally-formed":
            return {
                title: "Alliance forged",
                body: `${foe} accepts your alliance. Your nations now stand together. An attack on either is an attack on both.`,
            };
        case "ally-refused":
            return {
                title: "Proposal declined",
                body: `${foe} declines your offer of alliance.`,
            };
        case "war-declared":
            return {
                title: "War declared",
                danger: true,
                body: `${foe} has declared war on you.`,
            };
        case "called-to-arms":
            return {
                title: "Called to arms",
                danger: true,
                body: `${foe} attacked your ally, so you are now at war with them.`,
            };
        case "refused":
        default:
            return {
                title: "Offer rejected",
                body: `${foe} refuses your peace offer. The war goes on.`,
            };
    }
}

// `pop` overrides the queue: online matches have no per-player warPopups (the
// server can't address one seat), so LiveGame synthesizes the front alliance
// offer from the broadcast pendingAlliance queue and passes it in directly.
// `onDismiss` overrides the Continue/Escape action for informational popups —
// war-declaration alerts (see LiveGame's useWarAlerts) live in UI state, not the
// engine warPopups queue, so they clear themselves rather than via dismissWarPopup.
export default function WarOutcomeModal({world, api, pop: popOverride, onDismiss}) {
    const pop = popOverride ?? world.warPopups?.[0];
    const isOffer = pop?.kind === "offer";
    const isAllyOffer = pop?.kind === "ally-offer";
    const dismiss = () => (onDismiss ? onDismiss() : api.dismissWarPopup(pop.id));
    const onClose = () => {
        if (!pop) return;
        if (isOffer)
            api.respondPeace(pop.foe, false); // Escape / backdrop = decline
        else if (isAllyOffer) api.respondAlliance(pop.foe, false);
        else dismiss();
    };
    const ref = useModal(onClose);
    // Pause/resume side-effect lives in the parent (LiveGame) so hooks here stay
    // unconditional even when `pop` is briefly undefined between renders.
    if (!pop) return null;

    const foeNation = world.nations.find((n) => n.slot === pop.foe);
    const foe = nationName(world, pop.foe);
    const {title, body, danger} = content(pop.kind, foe);

    return (
        <div
            className={overlay({placement: "center"})}
            role="dialog"
            aria-modal="true"
            aria-labelledby="db-war-title"
            ref={ref}
            tabIndex={-1}
        >
            <div
                className={cn(
                    "db-hud-panel db-edge-rule pointer-events-auto w-[min(460px,94vw)] px-6 py-[22px] text-center motion-safe:animate-[dbPop_240ms_var(--ease-out)]",
                    danger && "danger",
                )}
            >
                {foeNation?.iso && (
                    <span className="mx-auto mb-4 grid place-items-center w-[74px] h-[50px] overflow-hidden border border-line bg-sunk [&>*]:w-full [&>*]:h-full [&>*]:object-cover">
                        <Flag iso={foeNation.iso} className="text-[26px]" />
                    </span>
                )}
                <div id="db-war-title" className="mb-2.5 text-[22px] font-semibold leading-[1.2] tracking-[-0.01em]">
                    {title}
                </div>
                <p className="m-0 mb-5 text-sm leading-[1.5] text-dim">{body}</p>
                {isOffer || isAllyOffer ? (
                    <div className="flex gap-[10px]">
                        <button
                            className={cn(button(), "flex-1")}
                            onClick={() =>
                                isAllyOffer ? api.respondAlliance(pop.foe, false) : api.respondPeace(pop.foe, false)
                            }
                        >
                            Decline
                        </button>
                        <button
                            className={cn(button({variant: "primary"}), "flex-1")}
                            onClick={() =>
                                isAllyOffer ? api.respondAlliance(pop.foe, true) : api.respondPeace(pop.foe, true)
                            }
                        >
                            Accept
                        </button>
                    </div>
                ) : (
                    <button className={cn(button({variant: "primary"}), "w-full")} onClick={dismiss}>
                        Continue
                    </button>
                )}
            </div>
        </div>
    );
}
