// Drive `frame(t, dt)` from requestAnimationFrame until the returned stop() is
// called. `t` is the rAF timestamp and `dt` the milliseconds since the previous
// delivered frame — 0 on the first frame and on the first frame after a resume,
// so callers must tolerate a zero step.
//
// `minDtMs` (default 0) throttles delivery: a frame arriving sooner than
// minDtMs after the last delivered one is skipped, and a skip does not advance
// the clock, so the next delivered `dt` spans the whole gap.
// `pauseWhenHidden` (default true) cancels the loop while the tab is hidden so
// a background tab costs nothing.
export function startPausableRaf(frame, options = {}) {
    const {minDtMs = 0, pauseWhenHidden = true} = options;
    let raf = 0;
    let running = true;
    let last = 0;
    const step = (t) => {
        if (!running) return;
        raf = requestAnimationFrame(step);
        const dt = last ? t - last : 0;
        if (minDtMs > 0 && dt < minDtMs) return;
        last = t;
        frame(t, dt);
    };
    const onVisibility = () => {
        const shouldRun = !document.hidden;
        if (shouldRun === running) return;
        running = shouldRun;
        if (running) {
            last = 0;
            raf = requestAnimationFrame(step);
        } else if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
        }
    };
    if (pauseWhenHidden) document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(step);
    return () => {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (pauseWhenHidden) document.removeEventListener("visibilitychange", onVisibility);
    };
}

// Does this viewer ask for less motion? Every decorative loop in the app gates on
// it, so it sits beside the loop driver rather than being re-declared next to each
// one. `matchMedia` is missing under SSR and in the test environment, so an absent
// implementation reads as no preference.
export function prefersReducedMotion() {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
