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
import {button, card, overlay, sub} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import Flag from "../common/Flag.jsx";

// Per-kind copy + accent. `foe` is the other belligerent's display name.
function content(kind, foe) {
    switch (kind) {
        case "victory":
            return {
                title: "Victory",
                tone: "text-good [text-shadow:0_0_26px_rgba(95,227,154,0.55)]",
                body: `${foe} has surrendered. Every territory you occupied is yours to keep.`,
            };
        case "defeat":
            return {
                title: "Defeat",
                tone: "text-danger [text-shadow:0_0_24px_rgba(224,87,79,0.55)]",
                body: `You have surrendered to ${foe}. The land they occupied is lost, and your nation is shaken for a year to come.`,
            };
        case "whitepeace":
            return {
                title: "White Peace",
                tone: "text-dim",
                body: `You and ${foe} agree to end the war. All occupied territory returns to its rightful owner, so no ground changes hands.`,
            };
        case "offer":
            return {
                title: "Peace Offer",
                tone: "text-dim",
                body: `${foe} offers a white peace: end the war now, with both sides returning to their pre-war borders.`,
            };
        case "ally-offer":
            return {
                title: "Alliance Proposal",
                tone: "text-[#5fa8ff] [text-shadow:0_0_24px_rgba(95,168,255,0.45)]",
                body: `${foe} proposes a mutual-defense pact. Neither of you will make war on the other, and an attack on one draws in the other.`,
            };
        case "ally-formed":
            return {
                title: "Alliance Forged",
                tone: "text-good [text-shadow:0_0_26px_rgba(95,227,154,0.45)]",
                body: `${foe} accepts your alliance. Your nations now stand together. An attack on either is an attack on both.`,
            };
        case "ally-refused":
            return {
                title: "Proposal Declined",
                tone: "text-dim",
                body: `${foe} declines your offer of alliance.`,
            };
        case "war-declared":
            return {
                title: "War Declared",
                tone: "text-danger [text-shadow:0_0_24px_rgba(224,87,79,0.55)]",
                body: `${foe} has declared war on you.`,
            };
        case "called-to-arms":
            return {
                title: "Called to Arms",
                tone: "text-danger [text-shadow:0_0_24px_rgba(224,87,79,0.55)]",
                body: `Your ally has been attacked, so you are now at war with ${foe}.`,
            };
        case "refused":
        default:
            return {
                title: "Offer Rejected",
                tone: "text-dim",
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
    const {title, tone, body} = content(pop.kind, foe);

    return (
        <div
            className={overlay({placement: "center"})}
            role="dialog"
            aria-modal="true"
            aria-labelledby="db-war-title"
            ref={ref}
            tabIndex={-1}
        >
            <div className={cn(card({size: "wide"}), "motion-safe:animate-[dbPop_240ms_var(--ease-out)]")}>
                {foeNation?.iso && (
                    <span className="db-notch-sm db-brackets relative mx-auto mb-4 grid place-items-center w-[74px] h-[50px] overflow-hidden border border-line bg-sunk [&>*]:w-full [&>*]:h-full [&>*]:object-cover">
                        <Flag iso={foeNation.iso} className="text-[26px]" />
                    </span>
                )}
                <div
                    id="db-war-title"
                    className={cn(
                        "font-display text-[34px] font-bold tracking-[0.09em] uppercase text-center mb-3 leading-[1.08]",
                        tone,
                    )}
                >
                    {title}
                </div>
                <p className={sub()}>{body}</p>
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
