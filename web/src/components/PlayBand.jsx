import {Check} from "lucide-react";
import Reveal from "./Reveal.jsx";
import GameIcon from "./GameIcon.jsx";
import PlayCta from "./PlayCta.jsx";
import {Eyebrow} from "./Primitives.jsx";
import {button, panel} from "../lib/variants.js";
import {cn} from "../lib/cn.js";

const PERKS = [
    "Free to play, with no purchase and no paywall",
    "Online multiplayer on the real world map",
    "Cross-play across macOS and Windows",
];

// Featured "play free" band on the landing page. Left rail pitches the launch;
// right card is the create-account / download call to action. Anchored at #play
// so the nav, hero, and footer can jump to it.
export default function PlayBand({onSignIn}) {
    return (
        <section id="play" className="relative scroll-mt-16 overflow-hidden border-y border-line bg-bg">
            <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />
            <div aria-hidden className="pointer-events-none absolute inset-0 db-vignette" />

            <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
                <div className="max-w-xl">
                    <Reveal>
                        <Eyebrow>Out now · Free to play</Eyebrow>
                        <h2 className="mt-6 text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.05] tracking-[-0.02em] text-text">
                            Take command <span className="text-dim">for free</span>
                        </h2>
                        <p className="mt-5 max-w-lg text-[clamp(1rem,1.35vw,1.12rem)] leading-relaxed text-dim">
                            DomeBreak is live and free to play. Create your account, download the game for macOS or
                            Windows, and go head to head with rival nations online. Your profile and match history
                            follow you everywhere.
                        </p>
                    </Reveal>

                    <Reveal delay={0.12}>
                        <ul className="mt-8 flex flex-col gap-3 border-t border-hair pt-6">
                            {PERKS.map((p) => (
                                <li key={p} className="flex items-start gap-3 text-[14px] leading-relaxed text-dim">
                                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center border border-line-2 text-text">
                                        <Check size={11} strokeWidth={3} />
                                    </span>
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </Reveal>

                    <Reveal delay={0.18}>
                        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-faint">
                            <span className="flex items-center gap-2">
                                <GameIcon name="dome" size={15} className="text-dim" />
                                Desktop · macOS + Windows
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="db-led db-led-ok" />
                                Servers live
                            </span>
                        </div>
                    </Reveal>
                </div>

                <Reveal delay={0.1}>
                    <div className={cn(panel(), "p-7 sm:p-8")}>
                        <div className="flex items-center gap-2 text-dim">
                            <GameIcon name="dome" size={22} />
                            <span className="text-[12px] font-medium text-faint">Get in the fight</span>
                        </div>
                        <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.01em] text-text">
                            Create your free account
                        </h3>
                        <p className="mt-2 text-[13px] leading-relaxed text-dim">
                            One account for the game and this site. Sign up in seconds, then grab the installer for your
                            platform.
                        </p>

                        <div className="mt-7 flex flex-col gap-3">
                            <PlayCta className="w-full" />
                            <button
                                type="button"
                                onClick={() => onSignIn?.("signup")}
                                className={cn(button({variant: "default", size: "lg"}), "w-full")}
                            >
                                Create a Free Account
                            </button>
                        </div>

                        <p className="mt-5 border-t border-hair pt-4 text-center text-[12.5px] leading-relaxed text-faint">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => onSignIn?.("signin")}
                                className="text-dim underline decoration-hair underline-offset-4 transition-colors hover:text-text"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
