import {useMemo} from "react";
import {evaluateObjectives} from "../../game/engine.js";
import {DrawerScreen} from "./ScreenFrame.jsx";
import Icon from "../common/Icon.jsx";
import Meter from "../common/Meter.jsx";
import {cn} from "../lib/cn.js";
import {useDisclosure} from "../../lib/hooks/useDisclosure.js";

// How many incomplete objectives the drawer opens with their tasks showing.
// The rest are listed behind them as queued, so the top of the list always
// reads as what to do next.
const MAX_ACTIVE = 3;

// Goals — every strategic objective, in the dock's drawer: the ones in hand
// first with their tasks and live progress, then the queue behind them, then a
// completed log. The map's tracker shows the current objective alone; this is
// the whole list. Presentation only — it reads the world through
// evaluateObjectives (sim/objectives.js owns what the goals ARE and whether
// they're met) and never touches game state.
//
// The land-coverage objective runs a full country-grid scan, so evaluation is
// memoized on the whole-second game clock rather than every animation frame — a
// checkmark can lag reaching a goal by at most one game-second, imperceptible
// here.
export default function GoalsScreen({world, mySlot, onClose}) {
    const second = Math.floor(world.time);
    const objectives = useMemo(
        () => evaluateObjectives(world, mySlot),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- throttled to the game-second clock; world/mySlot read inside
        [second, mySlot],
    );
    const {open: logOpen, toggle: toggleLog} = useDisclosure(false);

    const active = objectives.filter((o) => !o.done);
    const completed = objectives.filter((o) => o.done);
    const inHand = active.slice(0, MAX_ACTIVE);
    const queued = active.slice(MAX_ACTIVE);

    return (
        <DrawerScreen
            title="Goals"
            labelledBy="db-drawer-goals"
            caption={
                <>
                    <b>
                        {completed.length} / {objectives.length}
                    </b>{" "}
                    complete
                </>
            }
            onClose={onClose}
        >
            {objectives.length === 0 && (
                <p className="m-0 px-4 py-4 text-[12px] text-faint">No objectives in this match.</p>
            )}

            {active.length === 0 && objectives.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-4 text-good">
                    <Icon name="check" size={14} className="flex-none" strokeWidth={2.2} />
                    <span className="font-semibold text-[13px]">All objectives complete</span>
                </div>
            )}

            <ol className="m-0 p-0 list-none">
                {inHand.map((o, i) => (
                    <li key={o.id} className="px-4 py-3 border-b border-line">
                        <div className="flex items-start gap-[10px]">
                            <span
                                className="flex-none mt-[1px] w-[20px] h-[20px] grid place-items-center border border-line text-dim font-mono text-[10px] font-semibold tabular-nums"
                                aria-hidden="true"
                            >
                                {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold text-[13px] leading-tight text-text">{o.title}</div>
                                <div className="mt-[2px] text-[11px] leading-snug text-faint">{o.blurb}</div>
                                <ul className="m-0 mt-[9px] p-0 list-none flex flex-col gap-[7px]">
                                    {o.tasks.map((t) => (
                                        <li key={t.id}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "flex-none w-[15px] h-[15px] grid place-items-center border",
                                                        t.done
                                                            ? "border-good text-good"
                                                            : "border-line-2 text-transparent",
                                                    )}
                                                    aria-hidden="true"
                                                >
                                                    <Icon name="check" size={11} strokeWidth={2.4} />
                                                </span>
                                                <span
                                                    className={cn(
                                                        "flex-1 min-w-0 truncate text-[12px]",
                                                        t.done ? "text-dim" : "text-text",
                                                    )}
                                                >
                                                    {t.label}
                                                </span>
                                                <span
                                                    className={cn(
                                                        "flex-none font-mono text-[11px] tabular-nums",
                                                        t.done ? "text-good" : "text-dim",
                                                    )}
                                                >
                                                    {t.detail}
                                                </span>
                                            </div>
                                            <Meter
                                                frac={t.progress}
                                                className="mt-[5px] ml-[23px] h-[3px]"
                                                fillClass={t.done ? "bg-good" : "bg-accent"}
                                                ariaLabel={`${t.label} progress`}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </li>
                ))}
            </ol>

            {queued.length > 0 && (
                <section className="px-4 py-3 border-b border-line">
                    <h4 className="db-sec m-0 mb-2">Queued · {queued.length}</h4>
                    <ol className="m-0 p-0 list-none flex flex-col gap-[7px]">
                        {queued.map((o, i) => (
                            <li key={o.id} className="flex items-start gap-[10px]">
                                <span
                                    className="flex-none mt-[1px] w-[20px] h-[20px] grid place-items-center border border-line text-faint font-mono text-[10px] tabular-nums"
                                    aria-hidden="true"
                                >
                                    {inHand.length + i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="font-medium text-[12.5px] leading-tight text-dim">{o.title}</div>
                                    <div className="mt-[2px] text-[10.5px] leading-snug text-faint">{o.blurb}</div>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {completed.length > 0 && (
                <section>
                    <button
                        type="button"
                        onClick={toggleLog}
                        className="w-full flex items-center gap-2 px-4 py-[10px] text-left transition-colors duration-[var(--dur-fast)] hover:bg-hair"
                        aria-expanded={logOpen}
                        aria-controls="db-goals-log"
                    >
                        <Icon name="check" size={12} className="flex-none text-good" strokeWidth={2.2} />
                        <span className="db-sec">Completed</span>
                        <span className="font-mono text-[11px] tabular-nums text-good">{completed.length}</span>
                        <Icon
                            name="chevron-down"
                            size={13}
                            className={cn("ml-auto flex-none text-dim transition-transform", logOpen && "rotate-180")}
                        />
                    </button>
                    {logOpen && (
                        <ol id="db-goals-log" className="m-0 p-0 list-none pb-2">
                            {completed.map((o) => (
                                <li key={o.id} className="flex items-start gap-[10px] px-4 py-[7px]">
                                    <span
                                        className="flex-none mt-[1px] w-[20px] h-[20px] grid place-items-center border border-good text-good"
                                        aria-hidden="true"
                                    >
                                        <Icon name="check" size={12} strokeWidth={2.4} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-[12.5px] leading-tight text-dim">
                                            {o.title}
                                        </div>
                                        <div className="mt-[1px] text-[10.5px] leading-snug text-faint">{o.blurb}</div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            )}
        </DrawerScreen>
    );
}
