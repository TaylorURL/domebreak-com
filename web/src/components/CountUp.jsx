import {useEffect, useState} from "react";
import {useInViewOnce} from "../hooks/useInViewOnce.js";

const prefersReduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

// Counts from 0 to `value` the first time it scrolls into view, and, with
// `meter`, fills a segmented track alongside it on the same easing, so the
// figure and the bar read as one instrument coming up to its reading. Falls
// back to the final value and a full track immediately under reduced motion.
export default function CountUp({value, duration = 1.4, format = (n) => Math.round(n).toString(), className, meter}) {
    const [ref, inView] = useInViewOnce();
    const reduce = prefersReduced();
    const [display, setDisplay] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!inView || reduce) return;
        let raf;
        let start;
        const step = (t) => {
            if (start === undefined) start = t;
            const p = Math.min(1, (t - start) / (duration * 1000));
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(value * eased);
            setProgress(eased);
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [inView, value, duration, reduce]);

    const figure = (
        <span ref={meter ? undefined : ref} className={className}>
            {format(reduce ? value : display)}
        </span>
    );
    if (!meter) return figure;

    return (
        <span ref={ref} className="block">
            {figure}
            {/* The track owns the segment gaps; only the amber fill moves. */}
            <span className="db-seg mt-4 block h-[6px] w-full bg-line-soft [--db-seg-gap:var(--bg)]">
                <span
                    className="block h-full bg-gold"
                    style={{width: `${Math.round((reduce ? 1 : progress) * 100)}%`}}
                />
            </span>
        </span>
    );
}
