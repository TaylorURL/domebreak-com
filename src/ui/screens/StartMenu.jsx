import {useState} from "react";
import {menuButton} from "../lib/variants.js";
import {cn} from "../lib/cn.js";
import {fmtMonthYear, fmtPlaytimeHours, winRatePct} from "../lib/format.js";

// The marketing site. In the desktop app, target="_blank" is handed off to the
// system browser by main.cjs's setWindowOpenHandler (shell.openExternal).
const WEBSITE_URL = "https://domebreak.com";

export default function StartMenu({
    onNew,
    onContinue,
    onLoad,
    onSettings,
    onPlay,
    canContinue,
    profile,
    stats,
    onSignOut,
    onlineCount,
    updateAvailable,
    latestVersion,
    onUpdate,
}) {
    // Menu is a small two-level tree: the root offers the three top-level modes;
    // Single Player and Multiplayer each open a sub-panel. Settings opens its
    // own screen directly. Section state is local — App only supplies the mode
    // callbacks and never sees which section is open.
    const [section, setSection] = useState(null); // null | "single" | "multi"
    const since = fmtMonthYear(profile?.created_at);
    const total = stats?.total_matches ?? 0;
    const winRate = winRatePct(stats);
    const hours = fmtPlaytimeHours(stats);
    return (
        // Command rail: all menu chrome lives in a slim left-anchored console so the
        // live attract war owns the center of the globe, uncovered.
        <div className="absolute inset-0 z-10 block overflow-hidden p-0">
            <div className="absolute inset-0 -z-1 bg-[radial-gradient(ellipse_120%_100%_at_66%_46%,transparent_46%,rgba(0,0,0,0.5)_82%,rgba(0,0,0,0.8)_100%)]" />
            <aside
                className="absolute top-0 left-0 bottom-0 w-96 max-w-[84vw] flex flex-col pt-[46px] pr-[46px] pb-[26px] pl-10 text-left pointer-events-none animate-[dbRailIn_520ms_var(--ease-out-db)_both] motion-reduce:animate-none
                before:content-[''] before:absolute before:inset-0 before:-z-1 before:bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.64)_52%,rgba(0,0,0,0)_100%)] before:backdrop-blur-[9px] before:[mask-image:linear-gradient(90deg,#000_58%,transparent_100%)]"
            >
                <div className="mb-[34px]">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-medium text-faint">
                        <span className="db-led db-led-ok" />
                        System Online
                    </div>
                    <h1 className="font-semibold text-[46px] tracking-[0.08em] leading-[44px] text-dim">
                        DOME
                        <span className="block text-text">BREAK</span>
                    </h1>
                    <p className="text-dim text-[13px] mt-3 mb-0">Global missile command</p>
                </div>
                <nav className="flex flex-col gap-[9px] w-full mx-0 mb-[22px] pointer-events-auto">
                    {updateAvailable && (
                        <button
                            className={cn(menuButton({variant: "primary"}), "text-left flex items-center gap-2")}
                            onClick={onUpdate}
                            aria-label={
                                latestVersion
                                    ? `Install the DomeBreak v${latestVersion} update`
                                    : "Install the latest DomeBreak update"
                            }
                        >
                            <span className="db-led motion-safe:animate-[dbBlink_2.4s_var(--ease-io)_infinite]" />
                            {latestVersion ? `Update to v${latestVersion}` : "Update Available"}
                        </button>
                    )}
                    {section === null && (
                        <>
                            <button
                                className={cn(menuButton({variant: "primary"}), "text-left")}
                                onClick={() => setSection("multi")}
                            >
                                Multiplayer
                            </button>
                            <button className={cn(menuButton(), "text-left")} onClick={() => setSection("single")}>
                                Single Player
                            </button>
                            <button className={cn(menuButton(), "text-left")} onClick={onSettings}>
                                Settings
                            </button>
                        </>
                    )}
                    {section === "multi" && (
                        <>
                            <div className={menuButton({variant: "section"})}>Multiplayer</div>
                            <button className={cn(menuButton({variant: "primary"}), "text-left")} onClick={onPlay}>
                                Play
                            </button>
                            <div
                                className="flex items-center gap-2 px-1 py-0.5 text-[11px] font-medium text-faint"
                                aria-label={
                                    onlineCount != null
                                        ? `${onlineCount} commanders online`
                                        : "Commanders online, connecting"
                                }
                            >
                                <span className={cn("db-led", onlineCount != null ? "db-led-ok" : "db-led-warn")} />
                                {onlineCount != null ? (
                                    <span>
                                        <span className="font-mono tabular-nums">{onlineCount}</span> Online
                                    </span>
                                ) : (
                                    "Connecting…"
                                )}
                            </div>
                            <button
                                className={cn(menuButton({variant: "back"}), "text-left")}
                                onClick={() => setSection(null)}
                            >
                                Back
                            </button>
                        </>
                    )}
                    {section === "single" && (
                        <>
                            <div className={menuButton({variant: "section"})}>Single Player</div>
                            {canContinue && (
                                <button
                                    className={cn(menuButton({variant: "primary"}), "text-left")}
                                    onClick={onContinue}
                                >
                                    Continue
                                </button>
                            )}
                            <button className={cn(menuButton(), "text-left")} onClick={onNew}>
                                New Game
                            </button>
                            <button className={cn(menuButton(), "text-left")} onClick={onLoad}>
                                Load Game
                            </button>
                            <button
                                className={cn(menuButton({variant: "back"}), "text-left")}
                                onClick={() => setSection(null)}
                            >
                                Back
                            </button>
                        </>
                    )}
                </nav>
                <div className="relative w-full m-0 pointer-events-auto px-4 py-3 border border-line bg-panel-2 text-left">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-[13px] text-text">{profile?.username || "—"}</span>
                        <button
                            className="text-[11px] font-medium text-faint bg-transparent border border-line rounded-none px-2 py-[3px] transition-colors hover:text-danger hover:border-danger"
                            onClick={onSignOut}
                            aria-label="Sign out of commander account"
                        >
                            Sign Out
                        </button>
                    </div>
                    <div className="text-faint text-[11px] mt-1">
                        {profile ? `Commander since ${since || "—"}` : "—"}
                    </div>
                    <div
                        className="flex flex-wrap gap-x-2.5 gap-y-1 mt-2 text-[11px] text-dim [&_b]:font-mono [&_b]:tabular-nums [&_b]:font-medium [&_b]:text-text"
                        role="group"
                        aria-label="Career record"
                    >
                        <span title="Wins" aria-label={stats ? `${stats.wins} wins` : "Wins unavailable"}>
                            {stats ? <b>{stats.wins}W</b> : "—"}
                        </span>
                        <span title="Losses" aria-label={stats ? `${stats.losses} losses` : "Losses unavailable"}>
                            {stats ? <b>{stats.losses}L</b> : "—"}
                        </span>
                        <span
                            title="Total matches played"
                            aria-label={stats ? `${total} matches played` : "Matches unavailable"}
                        >
                            {stats ? <b>{total}</b> : "—"} Matches
                        </span>
                        <span
                            title="Win rate"
                            aria-label={stats ? `${winRate} percent win rate` : "Win rate unavailable"}
                        >
                            {stats ? <b>{winRate}%</b> : "—"} Win Rate
                        </span>
                        <span
                            title="Total time in command"
                            aria-label={hours != null ? `${hours} hours playtime` : "Playtime unavailable"}
                        >
                            {hours != null ? <b>{hours}h</b> : "—"} Playtime
                        </span>
                    </div>
                </div>
                <div className="mt-auto mb-0 flex items-center gap-3 text-[11px] pointer-events-auto text-faint">
                    <span className="font-mono tabular-nums">v{__APP_VERSION__}</span>
                    <a
                        href={WEBSITE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-faint underline underline-offset-2 transition-colors hover:text-text"
                        aria-label="Open the DomeBreak website"
                    >
                        domebreak.com
                    </a>
                </div>
            </aside>
        </div>
    );
}
