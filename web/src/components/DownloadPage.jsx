import {useEffect, useMemo, useState} from "react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import Reveal from "./Reveal.jsx";
import GameIcon from "./GameIcon.jsx";
import {Eyebrow} from "./Primitives.jsx";
import {cn} from "../lib/cn.js";
import {button, chip, panel} from "../lib/variants.js";
import useReleaseVersion from "../hooks/useReleaseVersion.js";

// Installers are self-hosted on the DomeBreak VPS: the stable root names are
// symlinks the release process repoints at the newest release, so these links
// always serve the latest installers and never dead-end mid-release. Past
// versions live under /vX.Y.Z/ on the same host. The version rendered beside
// them is read from that same host at runtime (useReleaseVersion) so the number
// on the page is always the one behind the buttons.
const RELEASE_BASE = "https://download.domebreak.com";

// File names must stay in step with what build-dist.sh and ship-dist.sh emit —
// they are the symlink names above, not per-version paths.
const PLATFORMS = [
    {
        id: "mac-arm64",
        os: "macOS",
        icon: "carrier",
        note: "macOS 10.13+",
        arch: "Apple Silicon",
        sub: "M1 and newer",
        file: "DomeBreak-mac-arm64.dmg",
    },
    {
        id: "mac-x64",
        os: "macOS",
        icon: "carrier",
        note: "macOS 10.13+",
        arch: "Intel",
        sub: "64-bit",
        file: "DomeBreak-mac-x64.dmg",
    },
    {
        id: "win-x64",
        os: "Windows",
        icon: "factory",
        note: "Windows 10+",
        arch: "x64",
        sub: "64-bit, most PCs",
        file: "DomeBreak-win-x64.exe",
    },
    {
        id: "win-arm64",
        os: "Windows",
        icon: "factory",
        note: "Windows 10+",
        arch: "ARM64",
        sub: "Windows on ARM",
        file: "DomeBreak-win-arm64.exe",
    },
];

// Which of the four installers this visitor most likely needs. Resolved on the
// client and never at module scope: there is no navigator during the prerender,
// and a platform baked into the document would be the build machine's rather
// than the reader's.
//
// The family comes from the platform string, which every engine answers. The CPU
// inside it only Chromium will say, so where it does not the family's common
// build stands — Apple Silicon on a Mac, x64 on a PC. A visitor on neither
// family gets the list in its declared order with nothing singled out.
function useVisitorPlatform() {
    const [id, setId] = useState(null);

    useEffect(() => {
        let live = true;

        (async () => {
            const data = navigator.userAgentData;
            const name = String(data?.platform || navigator.platform || navigator.userAgent || "");
            const mac = /mac/i.test(name);
            if (!mac && !/win/i.test(name)) return;

            // null where the engine will not say, so the two families fall back
            // in opposite directions without either one guessing from silence.
            let arm = null;
            try {
                const high = await data?.getHighEntropyValues?.(["architecture"]);
                if (high?.architecture) arm = /arm/i.test(high.architecture);
            } catch {
                // Asked and refused reads the same as never having asked.
            }

            if (!live) return;
            if (mac) setId(arm === false ? "mac-x64" : "mac-arm64");
            else setId(arm === true ? "win-arm64" : "win-x64");
        })();

        return () => {
            live = false;
        };
    }, []);

    return id;
}

function PlatformCard({platform, version, mine}) {
    return (
        <article className={cn(panel(), "flex h-full flex-col gap-3.5 bg-bg-2 p-6", mine && "border-line-2")}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center border border-line text-dim">
                <GameIcon name={platform.icon} size={30} />
            </span>

            <div>
                <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-text">
                    {platform.os}
                    <span className="mt-1 block text-[13px] font-normal leading-[20px] text-dim">{platform.arch}</span>
                </h2>
            </div>

            <p className="text-[12.5px] leading-[18px] text-faint">
                {platform.sub} · {platform.note}
            </p>

            {version && <span className={cn(chip({tone: "subtle"}), "w-fit")}>v{version}</span>}

            <div className="mt-auto border-t border-hair pt-3.5">
                <a
                    href={`${RELEASE_BASE}/${platform.file}`}
                    // The visible label names the build; the accessible name adds
                    // the OS and the file's own line for a reader arriving at the
                    // link out of context.
                    aria-label={`Download DomeBreak for ${platform.os} on ${platform.arch}: ${platform.sub}`}
                    // The visitor's own installer is the page's one primary
                    // button and the rest are secondary, so four downloads in a
                    // row still say which one to take. A visitor on neither
                    // family gets four secondaries, with nothing singled out.
                    className={cn(button({variant: mine ? "primary" : "default", size: "lg"}), "w-full")}
                >
                    Get {platform.arch}
                </a>
            </div>
        </article>
    );
}

export default function DownloadPage({onSignIn, onShowShortcuts}) {
    const version = useReleaseVersion();
    const mine = useVisitorPlatform();

    useEffect(() => {
        window.scrollTo({top: 0, behavior: "auto"});
    }, []);

    // The visitor's own installer leads, the rest of its family follows it, and
    // the other family keeps its declared order behind them.
    const ordered = useMemo(() => {
        const self = PLATFORMS.find((p) => p.id === mine);
        if (!self) return PLATFORMS;
        return [
            self,
            ...PLATFORMS.filter((p) => p.id !== self.id && p.os === self.os),
            ...PLATFORMS.filter((p) => p.os !== self.os),
        ];
    }, [mine]);

    return (
        <div className="relative min-h-dvh bg-bg text-text">
            <Nav onSignIn={onSignIn} />

            <main>
                <section className="relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-16">
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 db-vignette" />
                    <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
                        <Reveal>
                            <Eyebrow>Download</Eyebrow>
                            <h1 className="mt-5 max-w-3xl text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-text">
                                Get <span className="text-dim">DomeBreak</span>
                                {version ? ` v${version}` : ""}
                            </h1>
                            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-dim">
                                Free to play. Pick your platform: installers are served straight from the DomeBreak
                                server. See First launch below the first time you open the game.
                            </p>
                        </Reveal>
                    </div>
                </section>

                <div className="mx-auto max-w-[1280px] px-5 pb-24 sm:px-8">
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {ordered.map((p, i) => (
                            <Reveal key={p.id} delay={Math.min(i * 0.06, 0.24)} className="relative h-full">
                                <PlatformCard platform={p} version={version} mine={p.id === mine} />
                            </Reveal>
                        ))}
                    </div>

                    <Reveal>
                        <div className={cn(panel(), "mt-12 bg-bg-2 p-6")}>
                            <h3 className="text-[15px] font-semibold text-text">First launch</h3>
                            <p className="mt-3 text-[13px] leading-relaxed text-dim">
                                DomeBreak is not code-signed, so your OS asks you to confirm the first time you open it.
                                It is a one-time step per install.
                            </p>
                            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                                <div className="border-t border-hair pt-3">
                                    <dt className="text-[13px] font-semibold text-text">macOS</dt>
                                    <dd className="mt-1 text-[13px] leading-relaxed text-dim">
                                        Drag DomeBreak to Applications and open it. If macOS says it can't verify the
                                        developer, go to System Settings → Privacy &amp; Security, scroll down, and
                                        click
                                        <span className="text-text"> Open Anyway</span>.
                                    </dd>
                                </div>
                                <div className="border-t border-hair pt-3">
                                    <dt className="text-[13px] font-semibold text-text">Windows</dt>
                                    <dd className="mt-1 text-[13px] leading-relaxed text-dim">
                                        Run the installer. If Windows SmartScreen warns about an unknown publisher,
                                        click
                                        <span className="text-text"> More info</span> then
                                        <span className="text-text"> Run anyway</span>.
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </Reveal>

                    <p className="mt-10 text-center text-[12.5px] text-faint">
                        All versions ·{" "}
                        <a
                            href="https://download.domebreak.com/"
                            className="text-dim underline decoration-hair underline-offset-4 transition-colors hover:text-text"
                        >
                            download.domebreak.com
                        </a>
                    </p>
                </div>
            </main>

            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}
