import {Keyboard} from "lucide-react";
import {scrollToId} from "../lib/nav.js";
import {NAV_MENUS} from "../lib/navMenus.js";
import {Wordmark} from "./Primitives.jsx";
import GameIcon from "./GameIcon.jsx";
import PlayCta from "./PlayCta.jsx";
import ScrollVelocity from "./reactbits/ScrollVelocity.jsx";
import useReleaseVersion from "../hooks/useReleaseVersion.js";
import {chip} from "../lib/variants.js";

const ICON_STRIP = ["dome", "radar", "interceptor", "thaad", "silo", "reconsat", "carrier", "factory"];

const LEGAL_LINK = "text-[12.5px] text-faint transition-colors duration-150 hover:text-text";

function Col({title, children}) {
    return (
        <div className="flex flex-col gap-3">
            <span className="text-[12px] font-medium text-faint">{title}</span>
            {children}
        </div>
    );
}

// A footer link that either scrolls/routes internally or opens an external URL.
function FootLink({children, onClick, href}) {
    const cls =
        "flex items-center gap-2 text-left text-[13px] text-dim transition-colors duration-150 hover:text-text cursor-pointer";
    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
                {children}
            </a>
        );
    }
    return (
        <button onClick={onClick} className={cls}>
            {children}
        </button>
    );
}

// Render one of the shared nav groups as a footer column so the footer and the
// nav never disagree on what exists or how it's labelled.
function MenuCol({group}) {
    return (
        <Col title={group.label}>
            {group.items.map((it) =>
                it.external ? (
                    <FootLink key={it.label} href={it.external}>
                        {it.label}
                    </FootLink>
                ) : (
                    <FootLink key={it.label} onClick={() => scrollToId(it.target)}>
                        {it.label}
                    </FootLink>
                ),
            )}
        </Col>
    );
}

export default function Footer({onShowShortcuts}) {
    const version = useReleaseVersion();
    return (
        <footer className="relative overflow-hidden border-t border-line bg-bg">
            <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />

            {/* react-bits ScrollVelocity — a slow, scroll-reactive ghost marquee of
                the wordmark. Decorative only, hence aria-hidden on the wrapper. */}
            <div aria-hidden className="relative select-none border-b border-hair py-7">
                <ScrollVelocity
                    texts={["DomeBreak · Global Missile Command ·"]}
                    velocity={26}
                    numCopies={4}
                    damping={40}
                    className="font-semibold tracking-[0.04em] text-[color-mix(in_srgb,var(--text)_8%,transparent)]"
                />
            </div>

            <div className="relative mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20">
                <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
                    <div className="col-span-2 sm:col-span-4 lg:col-span-1">
                        <div className="flex items-center gap-3">
                            <GameIcon name="dome" size={22} className="text-text" />
                            <Wordmark className="text-[18px]" />
                        </div>
                        <p className="mt-3 text-[12.5px] text-faint">Global Missile Command</p>
                        <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-dim">
                            A real-time strategy game of missile defense and offense, fought on the real world map.
                        </p>
                        <div className="mt-6">
                            <PlayCta size="md" />
                        </div>
                        <div className="mt-5 inline-flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 border border-line px-3 py-2 text-[12px] text-faint">
                            <span className="flex items-center gap-2">
                                <span className="db-led db-led-warn" />
                                Now Live · Free to Play
                            </span>
                            <span className="flex items-center gap-2">
                                <span className="db-led db-led-warn" />
                                macOS + Windows
                            </span>
                            {version && <span className={chip({tone: "subtle"})}>{`v${version}`}</span>}
                        </div>
                    </div>

                    {NAV_MENUS.map((group) => (
                        <MenuCol key={group.label} group={group} />
                    ))}

                    <Col title="More">
                        <FootLink onClick={() => scrollToId("play")}>
                            <span className="db-led db-led-warn" />
                            Play Free
                        </FootLink>
                        <FootLink onClick={() => scrollToId("top")}>Top</FootLink>
                        <FootLink onClick={onShowShortcuts}>
                            <Keyboard size={14} />
                            Keyboard Shortcuts
                        </FootLink>
                    </Col>
                </div>

                <div className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hair pt-6 text-faint">
                    {ICON_STRIP.map((n) => (
                        <GameIcon
                            key={n}
                            name={n}
                            size={18}
                            className="opacity-70 transition-opacity hover:opacity-100"
                        />
                    ))}
                </div>

                {/* No copyright line here: the shared Split Rail below the page
                    carries the TaylorURL credit, and a second one beside it is the
                    per-project copy the one shared bar exists to remove. */}
                <div className="mt-6 flex flex-col gap-3 border-t border-hair pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[12.5px] text-faint">Made solo by Trenton Taylor</p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                        <a href="#/privacy" className={LEGAL_LINK}>
                            Privacy
                        </a>
                        <a href="#/terms" className={LEGAL_LINK}>
                            Terms
                        </a>
                        <a href="#/contact" className={LEGAL_LINK}>
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
