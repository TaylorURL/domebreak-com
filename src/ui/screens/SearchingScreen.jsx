import {useEffect, useRef, useState} from "react";
import {cancelMatch, fetchMyQueue, heartbeatQueue, quickMatch, watchQueue} from "../../account/lobby.js";
import {button, row, menuScreen, menuBg, menuInner, menuTitle} from "../lib/variants.js";
import {cn} from "../lib/cn.js";

const SEARCH_TIMEOUT_S = 120;
const HEARTBEAT_QUEUE_MS = 5000; // liveness ping cadence while searching (server stale window is 20s)

// "Searching for commanders..." beat between pressing Play and the matchmaker
// placing the caller in a formed lobby. Owns its own quick_match enrollment
// (mount + Retry) so App only needs to switch screens; purely observes the
// caller's own matchmaking_queue row via Realtime (+ a poll fallback) for the
// status:'matched' transition.
export default function SearchingScreen({onMatched, onCancel, reduceMotion, preQueued}) {
    const [elapsedS, setElapsedS] = useState(0);
    const [timedOut, setTimedOut] = useState(false);
    const [err, setErr] = useState(null);
    const [busy, setBusy] = useState(false);
    const matchedRef = useRef(false);
    const startedAtRef = useRef(null);

    const handleQueueRow = (row) => {
        if (matchedRef.current) return;
        if (row?.status === "matched" && row?.lobby_id) {
            matchedRef.current = true;
            onMatched?.(row.lobby_id);
        }
    };

    const enroll = async () => {
        setErr(null);
        setTimedOut(false);
        matchedRef.current = false;
        startedAtRef.current = Date.now();
        setElapsedS(0);
        if (preQueued) return; // party is already enrolled by db-party — just watch the queue
        const r = await quickMatch();
        if (r?.error) setErr(r.error);
    };

    useEffect(() => {
        enroll();
        const unsub = watchQueue(() => fetchMyQueue().then(handleQueueRow));
        // Prove we're still here so the server never sweeps our 'waiting' row as an
        // offline ghost. Stops mattering once matched (heartbeat_queue no-ops on a
        // 'matched' row).
        const beat = setInterval(() => {
            if (!matchedRef.current) heartbeatQueue();
        }, HEARTBEAT_QUEUE_MS);
        return () => {
            clearInterval(beat);
            unsub();
            // Leaving the search by any in-app path drops our row immediately (a
            // hard app-close/crash is caught by the server staleness sweep). No-op
            // once matched. Solo quick-match only — a party's rows are owned by the
            // party flow, so we don't yank a member out from under it here.
            if (!matchedRef.current && !preQueued) cancelMatch();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Elapsed-time tick + client-side searching timeout (mirrors the GDD's
    // server-offline handling: surface "couldn't find a match" with retry/cancel
    // rather than leaving the player stuck indefinitely).
    useEffect(() => {
        if (timedOut || matchedRef.current) return;
        const t = setInterval(() => {
            if (!startedAtRef.current) return;
            const s = Math.floor((Date.now() - startedAtRef.current) / 1000);
            setElapsedS(s);
            if (s >= SEARCH_TIMEOUT_S && !matchedRef.current) setTimedOut(true);
        }, 1000);
        return () => clearInterval(t);
    }, [timedOut]);

    const doCancel = async () => {
        if (busy) return;
        setBusy(true);
        await cancelMatch();
        setBusy(false);
        onCancel?.();
    };
    const doRetry = async () => {
        if (busy) return;
        setBusy(true);
        await cancelMatch();
        setBusy(false);
        enroll();
    };

    const mm = String(Math.floor(elapsedS / 60)).padStart(1, "0");
    const ss = String(elapsedS % 60).padStart(2, "0");

    return (
        <div className={menuScreen()}>
            <div className={menuBg()} />
            <div className={cn(menuInner(), "w-[min(420px,94vw)] text-center")}>
                <h1 className={menuTitle({sm: true})}>War Room</h1>
                {!timedOut ? (
                    <>
                        {/* Radar sweep: one turn every four seconds, transform-only,
                            standing down under the in-game reduce-motion setting as
                            well as the OS one. */}
                        <div className="grid place-items-center my-5" aria-hidden="true">
                            <span className={cn("db-radar", reduceMotion && "still")}>
                                <i className="db-radar-spoke" />
                            </span>
                        </div>
                        <div role="status" aria-live="polite">
                            <p className="db-searching-label text-sm text-text m-0">Searching for commanders…</p>
                            <p
                                className="db-searching-elapsed font-mono text-xl text-accent mt-2 tracking-[2px]"
                                aria-label={`Elapsed time ${mm} minutes ${ss} seconds`}
                            >
                                {mm}:{ss}
                            </p>
                        </div>
                        <div aria-live="assertive">
                            {err && (
                                <div className="db-friends-err db-notch-sm text-danger bg-[rgba(224,87,79,0.1)] border border-danger py-2 px-3 text-[12.5px] mt-2.5 text-left">
                                    <p className="m-0">Matchmaking is unavailable right now. Try again in a moment.</p>
                                    {/* The server's own words are what a bug report needs and what
                                        nobody reading the screen does, so they sit one click down,
                                        the way the net-error dialog keeps its dump. */}
                                    <details className="mt-1.5">
                                        <summary className="cursor-pointer font-display text-[10px] uppercase tracking-[0.18em] text-dim">
                                            Details
                                        </summary>
                                        <pre className="db-card-scroll m-0 mt-1.5 max-h-[96px] overflow-auto whitespace-pre-wrap font-mono text-[10.5px] leading-[1.5] text-faint select-text">
                                            {err}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </div>
                        <button
                            className={cn(button(), "block mt-4 mx-auto")}
                            disabled={busy}
                            onClick={doCancel}
                            aria-label="Cancel matchmaking search"
                        >
                            {busy ? "Cancelling…" : "Cancel"}
                        </button>
                    </>
                ) : (
                    <>
                        <p className="db-searching-label text-sm text-text m-0" role="status" aria-live="polite">
                            No commanders answered the call. Retry, or take the field solo.
                        </p>
                        <div className={row()}>
                            <button className={button({variant: "primary"})} disabled={busy} onClick={doRetry}>
                                {busy ? "Retrying…" : "Retry"}
                            </button>
                            <button
                                className={button()}
                                disabled={busy}
                                onClick={doCancel}
                                aria-label="Cancel matchmaking search"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
