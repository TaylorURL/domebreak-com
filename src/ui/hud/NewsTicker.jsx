import {useEffect, useLayoutEffect, useRef, useState} from "react";
import {cn} from "../lib/cn.js";
import {headline} from "../lib/newsHeadline.js";
import {useLatestRef} from "../../lib/hooks/useLatestRef.js";

const CAP = 40; // rolling headlines retained (the sim only keeps the last ~60 events)
const SPEED = 40; // px/sec — wall-clock scroll speed, independent of game speed
const SCAN_MS = 300; // fixed cadence to harvest new headlines, decoupled from the sim tick

// A scrolling news strip. Two things keep it smooth and speed-independent:
//
//  1. Headlines are harvested on a fixed wall-clock interval (NOT per sim tick),
//     so the update rate — and any layout cost — is identical at 1× and 5× game
//     speed. New headlines are APPENDED (they enter from the right and scroll
//     across), so adding one never shifts the currently-visible strip.
//  2. The scroll is a rAF loop advancing a continuous pixel offset in wall-clock
//     time, wrapped into (-w, 0] every frame against the live run width. It never
//     resets to the start; the duplicated second run makes the wrap seamless.
//     When old headlines are trimmed off the front, the exact width removed is
//     added back to the offset before paint, so trimming never makes it jump.
export default function NewsTicker({world, mySlot}) {
    const [items, setItems] = useState([]);
    const seen = useRef(new Set());
    const itemsRef = useRef([]); // mirror of items, matches the committed DOM between scans
    // Keep the scanner's view of world/mySlot current (engine mutates world in
    // place); updated after each render, well ahead of the 300 ms scan cadence.
    const ctx = useLatestRef({world, mySlot});

    const trackRef = useRef(null);
    const runRef = useRef(null);
    const offsetRef = useRef(0);
    const trimWidthRef = useRef(0); // front width removed this update, compensated pre-paint

    useEffect(() => {
        const scan = () => {
            const {world: w, mySlot: ms} = ctx.current;
            const fresh = [];
            for (const e of w.events) {
                if (seen.current.has(e.id)) continue;
                seen.current.add(e.id);
                const h = headline(e, w, ms);
                if (h) fresh.push({id: e.id, ...h});
            }
            if (seen.current.size > 400) seen.current = new Set(w.events.map((e) => e.id));
            if (!fresh.length) return;
            let next = [...itemsRef.current, ...fresh];
            const over = next.length - CAP;
            if (over > 0) {
                // Measure the front items about to be dropped (they're still in the
                // DOM, matching itemsRef) so the scroll can hold its visible place.
                const run = runRef.current;
                if (run && run.children.length > over) {
                    const firstLeft = run.children[0].getBoundingClientRect().left;
                    const cutLeft = run.children[over].getBoundingClientRect().left;
                    trimWidthRef.current += cutLeft - firstLeft;
                }
                next = next.slice(over);
            }
            itemsRef.current = next;
            setItems(next);
        };
        scan();
        const id = setInterval(scan, SCAN_MS);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Trimming the front shifts remaining content left; add the removed width back
    // to the offset before paint so the visible strip stays put (no jump).
    useLayoutEffect(() => {
        if (trimWidthRef.current) {
            offsetRef.current += trimWidthRef.current;
            trimWidthRef.current = 0;
        }
    }, [items]);

    const hasNews = items.length > 0;

    useEffect(() => {
        if (!hasNews) return;
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
        let raf,
            last = null;
        const step = (t) => {
            const track = trackRef.current,
                run = runRef.current;
            if (track && run) {
                if (last == null) last = t;
                const dt = Math.min((t - last) / 1000, 0.05); // clamp long frames (tab defocus)
                last = t;
                const w = run.scrollWidth || 1;
                let off = offsetRef.current - SPEED * dt;
                // Wrap into (-w, 0] against the live width — robust to the run
                // growing (tail append) or shrinking (front trim), so it never snaps.
                off %= w;
                if (off > 0) off -= w;
                offsetRef.current = off;
                track.style.transform = `translateX(${off}px)`;
            }
            raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [hasNews]);

    // One lamp per headline, in the shared LED vocabulary: a routine report is a
    // dim mark, a gain green, a warning amber, an attack red. None of them blink —
    // the strip's own live lamp is the one blinking light, and forty more competing
    // with it would say nothing at all.
    const toneClass = {
        info: "text-dim",
        good: "text-text",
        alert: "text-text",
        danger: "text-[#f0a39d]",
    };
    const dotToneClass = {
        info: "text-faint",
        good: "db-led-ok",
        alert: "db-led-warn",
        danger: "text-danger",
    };

    return (
        <div
            className="db-ticker db-hud-panel relative z-4 flex items-stretch w-[min(720px,100%)] h-[30px] overflow-hidden pointer-events-auto [--db-tab:0px] motion-safe:animate-[dbDropInY_340ms_var(--ease-drawer)] max-[900px]:hidden"
            aria-label="News feed"
            aria-live="polite"
        >
            <span className="db-ticker-tag flex items-center gap-[7px] px-[11px] font-mono text-[9px] tracking-[0.2em] uppercase text-faint bg-sunk border-r border-line flex-none">
                <span className="db-led db-led-live" aria-hidden="true" />
                Live Wire
            </span>
            <div className="db-ticker-track relative flex-1 overflow-hidden flex items-center">
                {hasNews ? (
                    <div className="inline-flex flex-nowrap whitespace-nowrap will-change-transform" ref={trackRef}>
                        {[0, 1].map((copy) => (
                            <div
                                className={cn("inline-flex flex-nowrap", copy === 1 && "motion-reduce:hidden")}
                                key={copy}
                                ref={copy === 0 ? runRef : null}
                                aria-hidden={copy === 1}
                            >
                                {items.map((it, i) => (
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-[9px] px-[22px] font-mono text-[11px] text-text whitespace-nowrap",
                                            toneClass[it.tone],
                                        )}
                                        key={`${copy}-${it.id}-${i}`}
                                    >
                                        <span className={cn("db-led", dotToneClass[it.tone])} aria-hidden="true" />
                                        {it.text}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="px-4 font-mono text-[11px] text-faint">Monitoring global activity…</span>
                )}
            </div>
        </div>
    );
}
