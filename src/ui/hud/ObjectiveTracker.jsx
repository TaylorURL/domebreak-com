import {useMemo} from "react";
import Icon from "../common/Icon.jsx";
import {evaluateObjectives} from "../../game/engine.js";
import {cn} from "../lib/cn.js";

// The objective tracker: the one goal in front of you, its tasks, and how far
// through it you are. The whole list, the queue and the completed log live in
// the Goals drawer, which the foot opens.
//
// The land-coverage objective runs a full country-grid scan, so evaluation is
// memoized on the whole-second game clock rather than every animation frame — a
// checkmark can lag reaching a goal by at most one game-second, imperceptible here.
export default function ObjectiveTracker({world, mySlot, onOpenGoals}) {
    const second = Math.floor(world.time);
    const objectives = useMemo(
        () => evaluateObjectives(world, mySlot),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- throttled to the game-second clock; world/mySlot read inside
        [second, mySlot],
    );
    if (!objectives.length) return null;

    const active = objectives.filter((o) => !o.done);
    const doneCount = objectives.length - active.length;
    const current = active[0];
    const next = active[1];
    const queued = Math.max(0, active.length - 2);

    return (
        <div
            className="db-hud-panel relative w-[340px] px-[14px] py-3 pointer-events-auto"
            role="region"
            aria-label="Objective tracker"
        >
            <div className="flex items-center gap-2 text-[11.5px] leading-none text-faint">
                <Icon name="target" size={15} className="text-text" />
                <b className="font-medium text-dim">
                    {current ? `Objective ${objectives.indexOf(current) + 1} of ${objectives.length}` : "Objectives"}
                </b>
                <span className="ml-auto" aria-live="polite">
                    {doneCount} done
                </span>
            </div>

            {current ? (
                <>
                    <h3 className="mt-1 mb-2 text-[15px] font-semibold leading-tight">{current.title}</h3>
                    {current.tasks.map((t, i) => (
                        <div key={t.id} className={cn("flex items-center gap-[10px] text-[13px]", i > 0 && "mt-[6px]")}>
                            <span
                                className={cn(
                                    "relative flex-none grid place-items-center w-[15px] h-[15px] border",
                                    t.done ? "border-good text-good" : "border-line-2 text-transparent",
                                )}
                                aria-hidden="true"
                            >
                                <Icon name="check" size={11} strokeWidth={2.4} />
                            </span>
                            <span className={cn("flex-1 min-w-0 truncate", t.done ? "text-dim" : "text-text")}>
                                {t.label}
                            </span>
                            <span className="flex-none font-mono text-[12px] tabular-nums text-dim">{t.detail}</span>
                        </div>
                    ))}
                    <div
                        className="h-[4px] mt-[10px] bg-line"
                        role="progressbar"
                        aria-label={`${current.title} progress`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(
                            (current.tasks.reduce((a, t) => a + Math.min(1, t.progress || 0), 0) /
                                (current.tasks.length || 1)) *
                                100,
                        )}
                    >
                        <i
                            className="block h-full bg-accent transition-[width] duration-300 ease-out-db"
                            style={{
                                width: `${
                                    (current.tasks.reduce((a, t) => a + Math.min(1, t.progress || 0), 0) /
                                        (current.tasks.length || 1)) *
                                    100
                                }%`,
                            }}
                        />
                    </div>
                </>
            ) : (
                <div className="flex items-center gap-2 mt-2 mb-1 text-good">
                    <Icon name="check" size={14} strokeWidth={2.2} />
                    <span className="text-[13px] font-semibold">All objectives complete</span>
                </div>
            )}

            <button
                type="button"
                className="flex items-center justify-between gap-2 w-full mt-[10px] text-left text-[12px] text-faint transition-colors duration-[var(--dur-fast)] hover:text-text"
                onClick={() => onOpenGoals?.()}
                title="Open the Goals drawer"
            >
                <span className="truncate">
                    {next ? `Next: ${next.title}` : "No next objective"}
                    {queued > 0 && ` · ${queued} queued`}
                </span>
                <Icon name="chevron-down" size={15} className="flex-none -rotate-90" />
            </button>
        </div>
    );
}
