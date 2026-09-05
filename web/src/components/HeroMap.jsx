import {lazy, Suspense, useEffect, useState} from "react";
import {useReducedMotion} from "motion/react";
import {canAffordScene} from "../lib/sceneBudget.js";

// Animated hero background: a pre-made, looping "defense of the United States"
// scene on the game's real flat command map (see HeroDefenseScene). Incoming
// ICBMs arc in and US batteries intercept them, over and over — art-directed
// scenery, not the live simulation.
//
// Reveal + performance:
//  - Nothing shows at first; the hero layout animates in while the map chunk
//    (MapLibre + the game's render layers) loads in the background, deferred
//    until the page has painted and gone idle.
//  - The scene eases in only once MapLibre has painted its first tiles (or a
//    fallback timer fires), so the layout animation plays first and the hero is
//    never a blank flash.
//  - PERF: HeroDefenseScene stands its loop + MapLibre repaints fully down
//    whenever it scrolls off screen or the tab is hidden.
//  - Reduced motion renders the same scene held still (no missiles, no drift) —
//    a static tactical map of the homeland and its defenses.
//  - A machine that cannot afford the scene never mounts it at all: no GPU, too
//    little memory, too few cores, a metered or slow connection, or a window too
//    narrow to see the thing in (sceneBudget.js). Every tile such a machine drew
//    would come out of the thread the page needs for everything else, and a
//    held-still map costs that once per tile too.
const TILES_BASE = "https://pc9hvrpdxxi66b3t.public.blob.vercel-storage.com";
const MIN_HOLD_MS = 1400;
const FALLBACK_MS = 9000;

const HeroDefenseScene = lazy(() => import("./HeroDefenseScene.jsx"));

const LARGEST_PAINT = "largest-contentful-paint";

// The scene waits on two things rather than one. The load event says the page's
// own resources are in; the largest contentful paint says the browser has
// settled what the visitor came to look at. On load alone this put a megabyte of
// tiles and a live WebGL context in front of that paint, on the machines that
// can least spare the thread. A browser with no such paint to report (Safari has
// none) waits on load the way this always did, and a tab still in the background
// reports no paint at all — which is exactly when nothing should be starting.
function whenSceneCanStart(cb) {
    if (typeof window === "undefined") return () => {};
    let done = false;
    // Whichever of the two the browser gave us, so cancelling reaches it. A
    // cleanup that only drops the listeners leaves an already-scheduled callback
    // to fire into a component that is gone.
    let idle = null;
    let timer = null;
    let observer = null;
    let loaded = document.readyState === "complete";
    let painted = !window.PerformanceObserver?.supportedEntryTypes?.includes(LARGEST_PAINT);
    const run = () => {
        if (done) return;
        done = true;
        cb();
    };
    const schedule = () => {
        if (done || !loaded || !painted || idle !== null || timer !== null) return;
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(run, {timeout: 1800});
        else timer = setTimeout(run, 400);
    };
    const onLoad = () => {
        loaded = true;
        schedule();
    };
    if (!loaded) window.addEventListener("load", onLoad, {once: true});
    if (!painted) {
        observer = new PerformanceObserver(() => {
            painted = true;
            observer.disconnect();
            observer = null;
            schedule();
        });
        // Buffered: the largest paint of a document that ships its own markup is
        // reported before this component exists to ask about it.
        observer.observe({type: LARGEST_PAINT, buffered: true});
    }
    schedule();
    return () => {
        done = true;
        window.removeEventListener("load", onLoad);
        observer?.disconnect();
        if (idle !== null && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
        if (timer !== null) clearTimeout(timer);
    };
}

export default function HeroMap() {
    const reduce = useReducedMotion();
    const [mount, setMount] = useState(false);
    const [tilesReady, setTilesReady] = useState(false);
    const [minElapsed, setMinElapsed] = useState(false);
    const [fallback, setFallback] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setMinElapsed(true), MIN_HOLD_MS);
        const t2 = setTimeout(() => setFallback(true), FALLBACK_MS);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    // Off-origin CDN for the heavy vector tiles (WorldMap reads this at style
    // build). Set before the scene mounts. Defer the mount until the page has
    // painted and gone idle, and then only where the machine can carry it.
    useEffect(() => {
        if (typeof window !== "undefined") window.__DB_TILES_BASE__ = TILES_BASE;
        const cancel = whenSceneCanStart(() => {
            if (!canAffordScene()) return;
            setMount(true);
        });
        return cancel;
    }, []);

    const reveal = (tilesReady && minElapsed) || fallback;
    // Reduced motion fades in without the scale drift.
    const enter = reduce
        ? reveal
            ? "opacity-100"
            : "opacity-0"
        : reveal
          ? "scale-100 opacity-100"
          : "scale-[1.06] opacity-0";

    return (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            {mount && (
                <Suspense fallback={null}>
                    <div
                        className={`absolute inset-0 origin-center transition-[opacity,transform] duration-[1500ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${enter}`}
                    >
                        <HeroDefenseScene still={reduce} onReady={() => setTilesReady(true)} />
                    </div>
                </Suspense>
            )}
        </div>
    );
}
