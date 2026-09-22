import {useRef} from "react";
import {motion, useReducedMotion, useScroll, useTransform} from "motion/react";
import {ChevronDown} from "lucide-react";
import HeroMap from "./HeroMap.jsx";
import PlayCta from "./PlayCta.jsx";
import {Eyebrow, Wordmark} from "./Primitives.jsx";
import {button} from "../lib/variants.js";
import {scrollToId} from "../lib/nav.js";

// The stat strip under the rule. Each line is a lamp and a reading: the tone
// says which instrument it came off — sensor for what the map counts, ok for
// what is built, warn for the clock, live for the platforms it runs on.
const SPECS = [
    {tone: "sensor", label: "222 nations"},
    {tone: "ok", label: "Defense & offense"},
    {tone: "warn", label: "Real-time strategy"},
    {tone: "live", label: "Desktop · macOS + Windows"},
];

const fadeUp = (reduce, delay) => ({
    initial: reduce ? {opacity: 0} : {opacity: 0, transform: "translateY(14px)"},
    animate: {opacity: 1, transform: "translateY(0px)"},
    transition: {duration: 0.7, delay, ease: [0.23, 1, 0.32, 1]},
});

export default function Hero({onSignIn}) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const {scrollYProgress} = useScroll({target: ref, offset: ["start start", "end start"]});
    const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-14%"]);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    return (
        <section ref={ref} className="relative min-h-[100svh] w-full overflow-hidden">
            {/* Pre-made looping US-defense scene on the game's flat command map. */}
            <HeroMap />

            {/* Instrument overlays. */}
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0 db-grid" />
            <div aria-hidden className="pointer-events-none absolute inset-0 z-0 db-vignette" />
            {/* The copy sits on the board itself, and the board is bright wherever
                the coast and the sensor rings are. So the ground under the copy is
                held at the page colour for exactly the width of the column — 36rem
                plus the container's gutter, which is what the calc adds up — and
                released over the 10rem after it. That release lands in the gap
                between the column and the framed scene, so the half the scene is
                on keeps the map at full strength. */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-0 w-full bg-[linear-gradient(90deg,var(--bg)_0%,var(--bg)_calc(100%-4rem),var(--chrome-soft)_calc(100%-1.5rem),transparent_100%)] md:w-[calc(608px+max(0px,(100vw-1400px)/2)+12rem)] md:bg-[linear-gradient(90deg,var(--bg)_0%,var(--bg)_calc(100%-12rem),var(--chrome-strong)_calc(100%-9rem),var(--chrome-soft)_calc(100%-6rem),transparent_100%)]"
            />

            {/* The frame around the live scene: corner brackets on the open half
                of the board, and the theatre it is showing read out beneath them
                in mono. Decorative — the map itself is scenery, not a control. */}
            <motion.div
                aria-hidden
                {...fadeUp(reduce, 0.5)}
                className="pointer-events-none absolute right-8 top-[17%] z-10 hidden w-[42%] max-w-[620px] lg:block"
            >
                <div className="relative db-brackets db-notch aspect-[620/470] border border-line [--db-bracket:14px]" />
                <div className="mt-2 flex items-center justify-between gap-4 border border-line bg-panel px-3 py-[7px] font-mono text-[10px] uppercase tracking-[0.22em] text-faint">
                    <span className="flex items-center gap-2">
                        <span className="db-led db-led-live" />
                        Threat board · Live
                    </span>
                    <span className="hidden text-dim/80 xl:inline">Homeland defense · CONUS · Intercept grid</span>
                </div>
            </motion.div>

            <motion.div
                style={reduce ? undefined : {y: contentY, opacity: contentOpacity}}
                className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-center px-5 pt-24 pb-16 sm:px-8"
            >
                <div className="relative max-w-xl">
                    <motion.div {...fadeUp(reduce, 0)}>
                        <Eyebrow framed>Out now · Free to play</Eyebrow>
                        <h1 className="mt-6">
                            <Wordmark stacked glow className="text-[clamp(3.25rem,8vw,6rem)]" />
                        </h1>
                        <p className="mt-5 font-display text-[12px] font-semibold uppercase tracking-[0.3em] text-dim sm:text-[13.5px]">
                            Global Missile Command
                        </p>
                    </motion.div>

                    <motion.p
                        {...fadeUp(reduce, 0.12)}
                        className="mt-7 max-w-lg text-[clamp(0.98rem,1.35vw,1.15rem)] leading-relaxed text-dim"
                    >
                        A real-time strategy game of missile defense and offense, fought on the
                        <span className="text-text"> real world map</span>. Build your dome, plan your strikes, and
                        outlast every <span className="text-text">rival nation</span>.
                    </motion.p>

                    <motion.div {...fadeUp(reduce, 0.24)} className="mt-8">
                        <div className="flex flex-wrap items-center gap-3">
                            <PlayCta />
                            <button
                                onClick={() => onSignIn("signup")}
                                className={button({variant: "default", size: "lg"})}
                            >
                                Create a Free Account
                            </button>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 font-display text-[12px] font-semibold uppercase tracking-[0.14em]">
                            <button
                                onClick={() => scrollToId("play")}
                                className="group inline-flex items-center gap-2 text-text transition-colors hover:text-gold-hi"
                            >
                                <span className="db-led db-led-live" />
                                Free · Online Multiplayer
                                <ChevronDown
                                    size={13}
                                    className="-rotate-90 transition-transform group-hover:translate-x-0.5"
                                />
                            </button>
                            <button
                                onClick={() => onSignIn("signin")}
                                className="text-dim transition-colors hover:text-text"
                            >
                                Have an account? Sign in
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        {...fadeUp(reduce, 0.34)}
                        className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hair pt-6"
                    >
                        {SPECS.map((s) => (
                            <span
                                key={s.label}
                                className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint"
                            >
                                <span className={`db-led db-led-${s.tone}`} />
                                {s.label}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
                <motion.div
                    aria-hidden
                    animate={
                        reduce ? undefined : {transform: ["translateY(0px)", "translateY(6px)", "translateY(0px)"]}
                    }
                    transition={{duration: 2.4, repeat: Infinity, ease: "easeInOut"}}
                    className="flex flex-col items-center gap-1 font-mono text-[10px] uppercase tracking-[0.28em] text-faint"
                >
                    <span>Scroll</span>
                    <ChevronDown size={14} />
                </motion.div>
            </div>
        </section>
    );
}
