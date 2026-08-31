import {useRef} from "react";
import {motion, useReducedMotion, useScroll, useTransform} from "motion/react";
import {cn} from "../lib/cn.js";
import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";
import {useInViewOnce} from "../hooks/useInViewOnce.js";
import GameIcon from "./GameIcon.jsx";

// One feature showcase: framed in-game screenshot on one side, briefing copy on
// the other. The image wipes in (clip-path) on scroll and drifts with a light
// parallax; sides alternate down the page. `icon` is a game unit-icon slug.
// Each screenshot is stored at 2600 wide and again at 1600 and 900, so a phone
// stops downloading a file it can only draw a third of. The narrow copies sit
// beside the original with a -900w / -1600w suffix.
const srcSet = (src) => {
    const base = src.replace(/\.webp$/, "");
    return `${base}-900w.webp 900w, ${base}-1600w.webp 1600w, ${src} 2600w`;
};

export default function ShowcaseSection({
    index,
    kicker,
    title,
    body,
    points = [],
    image,
    imageAlt,
    side = "left",
    icon,
}) {
    const ref = useRef(null);
    const reduce = useReducedMotion();
    const {scrollYProgress} = useScroll({target: ref, offset: ["start end", "end start"]});
    const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["6%", "-6%"]);
    const [panelRef, panelIn] = useInViewOnce();

    const imageFirst = side === "left";

    return (
        <section
            ref={ref}
            // Four of these sit below the fold and each costs style and layout at
            // load whether or not anybody scrolls to it. `auto` on the intrinsic
            // size means the fallback is used once and the real height is
            // remembered after that, so the scrollbar settles where it would have.
            // None of them is a scroll target, which is why the treatment stops
            // here rather than going on the sections the nav jumps to.
            style={{contentVisibility: "auto", containIntrinsicSize: "auto 900px"}}
            className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-24"
        >
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <div className={cn("order-1", imageFirst ? "lg:order-1" : "lg:order-2")}>
                    <div
                        ref={panelRef}
                        className="relative db-tick db-seam overflow-hidden rounded-lg border border-line bg-panel-solid shadow"
                        style={{
                            clipPath: reduce ? "none" : panelIn ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)",
                            opacity: panelIn ? 1 : reduce ? 1 : 0,
                            transition: "clip-path 0.9s cubic-bezier(0.77,0,0.175,1), opacity 0.6s ease",
                        }}
                    >
                        <div className="overflow-hidden">
                            <motion.img
                                src={image}
                                srcSet={srcSet(image)}
                                // Half the column past 1024 and the whole of it below,
                                // which is what the grid does. Without this the browser
                                // assumes full width and picks a file twice the size it
                                // needs on every desktop.
                                sizes="(min-width: 1024px) 50vw, 100vw"
                                alt={imageAlt}
                                width={2600}
                                height={1626}
                                loading="lazy"
                                decoding="async"
                                style={reduce ? undefined : {y: imgY, scale: 1.08}}
                                className="aspect-[16/10] w-full object-cover"
                            />
                        </div>
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-line bg-chrome px-4 py-2 backdrop-blur-[8px]">
                            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-faint">
                                {icon && <GameIcon name={icon} size={13} className="text-dim" />}
                                DBK-{index}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-dim">{kicker}</span>
                        </div>
                    </div>
                </div>

                <div className={cn("order-2", imageFirst ? "lg:order-2" : "lg:order-1")}>
                    <Reveal>
                        <div className="flex items-center gap-4">
                            {icon && (
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-line bg-gold-soft text-gold">
                                    <GameIcon name={icon} size={22} />
                                </span>
                            )}
                            <div className="flex items-baseline gap-4">
                                <span className="font-mono text-[13px] font-semibold text-faint">{index}</span>
                                <Eyebrow dot={false}>{kicker}</Eyebrow>
                            </div>
                        </div>
                        <h2 className="mt-5 font-display text-[clamp(1.8rem,4vw,3rem)] font-bold uppercase leading-[1.02] tracking-[0.01em] text-text">
                            {title}
                        </h2>
                        <p className="mt-5 max-w-xl text-[clamp(1rem,1.3vw,1.12rem)] leading-relaxed text-dim">
                            {body}
                        </p>
                    </Reveal>

                    {points.length > 0 && (
                        <ul className="mt-8 space-y-3">
                            {points.map((p, i) => (
                                <Reveal as="li" key={p} delay={0.06 * (i + 1)}>
                                    <div className="flex items-start gap-3 border-t border-hair pt-3">
                                        <span className="mt-2 h-[6px] w-[6px] shrink-0 rounded-full bg-gold" />
                                        <span className="text-[15px] leading-relaxed text-dim">{p}</span>
                                    </div>
                                </Reveal>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}
