import {useEffect, useState, useCallback} from "react";
import {Lock, Loader2, LogIn, ShieldAlert, RotateCw, Inbox} from "lucide-react";
import Nav from "./Nav.jsx";
import Footer from "./Footer.jsx";
import Reveal from "./Reveal.jsx";
import {Eyebrow} from "./Primitives.jsx";
import {cn} from "../lib/cn.js";
import {button, chip, panel} from "../lib/variants.js";
import {useAccount} from "../lib/accountStore.js";
import {BETA_PLATFORMS} from "../lib/beta.js";
import {fmtDate} from "../lib/dates.js";

const PLATFORM_LABEL = Object.fromEntries(BETA_PLATFORMS.map((p) => [p.id, p.label]));

// Centered status card for the gated states (checking / signed-out / not admin).
function GateCard({icon, eyebrow, title, body, action}) {
    return (
        <section className="relative overflow-hidden pt-28 pb-24 sm:pt-32 sm:pb-28">
            <div aria-hidden className="pointer-events-none absolute inset-0 db-grid" />
            <div aria-hidden className="pointer-events-none absolute inset-0 db-vignette" />
            <div className="relative mx-auto max-w-[1100px] px-5 sm:px-8">
                <Reveal>
                    <div
                        className={cn(
                            panel({frame: "glass"}),
                            "db-seam mx-auto w-[min(560px,94vw)] p-[26px] text-center sm:p-10",
                        )}
                    >
                        <span className="db-notch-sm mx-auto flex h-14 w-14 items-center justify-center border border-gold-line bg-gold-soft text-gold">
                            {icon}
                        </span>
                        <div className="mt-6 flex justify-center">
                            <Eyebrow framed>{eyebrow}</Eyebrow>
                        </div>
                        <h1 className="mt-4 font-display text-[clamp(1.6rem,4vw,2.3rem)] font-bold uppercase leading-[1.05] text-text">
                            {title}
                        </h1>
                        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-dim">{body}</p>
                        {action && <div className="mt-8 flex justify-center border-t border-hair pt-6">{action}</div>}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// Read-only closed-beta review panel at #/admin. Visible only to a signed-in
// account whose profile carries is_admin (enforced again server-side by the
// db-beta function). Everyone else gets a gated card.
export default function AdminPanel({onSignIn, onShowShortcuts}) {
    const {loading, signedIn, isAdmin, listBeta} = useAccount();
    // The panel is only ever mounted for a visit that will fetch, so it opens on
    // its own spinner rather than on an idle state no reader is shown.
    const [state, setState] = useState("loading"); // loading | done | error
    const [rows, setRows] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        window.scrollTo({top: 0, behavior: "auto"});
    }, []);

    // One listBeta() result applied to the panel. Both callers below settle
    // through here so the list and its failure read the same either way.
    const apply = useCallback((res) => {
        if (res.ok) {
            setRows(res.applications);
            setError("");
            setState("done");
        } else {
            setError(res.error || "Failed to load applications.");
            setState("error");
        }
    }, []);

    // Fetch once the account has resolved to a signed-in admin. The request is
    // what the effect starts; the state it settles moves when the answer lands,
    // not while the effect is still running.
    useEffect(() => {
        if (loading || !signedIn || !isAdmin) return undefined;
        let live = true;
        listBeta().then((res) => live && apply(res));
        return () => {
            live = false;
        };
    }, [loading, signedIn, isAdmin, listBeta, apply]);

    const reload = useCallback(async () => {
        setState("loading");
        setError("");
        apply(await listBeta());
    }, [apply, listBeta]);

    let content;
    if (loading) {
        content = (
            <GateCard
                icon={<Loader2 size={26} className="animate-spin" />}
                eyebrow="Checking access"
                title="One moment"
                body="Confirming your session before the review panel loads."
            />
        );
    } else if (!signedIn) {
        content = (
            <GateCard
                icon={<Lock size={26} />}
                eyebrow="Restricted"
                title="Admin sign-in required"
                body="This review panel is limited to DomeBreak admins. Sign in with an admin account to continue."
                action={
                    <button
                        onClick={onSignIn}
                        className={cn(button({variant: "primary", size: "lg"}), "w-full max-w-xs")}
                    >
                        <LogIn size={15} />
                        <span>Sign In</span>
                    </button>
                }
            />
        );
    } else if (!isAdmin) {
        content = (
            <GateCard
                icon={<ShieldAlert size={26} />}
                eyebrow="Forbidden"
                title="Not authorized"
                body="Your account doesn't have admin access. If you think that's a mistake, get in touch through the contact page."
            />
        );
    } else {
        content = (
            <section className="relative pt-28 pb-24 sm:pt-32">
                <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
                    <Reveal>
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <Eyebrow framed>Admin · Closed beta</Eyebrow>
                                <h1 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold uppercase leading-[1.02] text-text">
                                    Beta applications
                                </h1>
                                <p className="mt-3 text-[14px] text-dim">
                                    {state === "done"
                                        ? `${rows.length} application${rows.length === 1 ? "" : "s"} · newest first`
                                        : "Everyone who has applied to test the closed beta."}
                                </p>
                            </div>
                            <button
                                onClick={reload}
                                disabled={state === "loading"}
                                className={cn(button({variant: "default", size: "sm"}))}
                            >
                                <RotateCw size={13} className={cn(state === "loading" && "animate-spin")} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </Reveal>

                    <Reveal delay={0.08}>
                        <div className={cn(panel(), "db-tab-rule mt-8")} style={{"--db-tab": "108px"}}>
                            {state === "loading" ? (
                                <div className="flex items-center justify-center gap-3 py-20 text-dim">
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="font-mono text-[12px] uppercase tracking-[0.18em]">
                                        Loading applications
                                    </span>
                                </div>
                            ) : state === "error" ? (
                                <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                                    <ShieldAlert size={26} className="text-danger" />
                                    <p className="max-w-sm text-[14px] text-dim">{error}</p>
                                    <button onClick={reload} className={cn(button({variant: "default", size: "sm"}))}>
                                        <RotateCw size={13} />
                                        <span>Try Again</span>
                                    </button>
                                </div>
                            ) : rows.length === 0 ? (
                                <div className="flex flex-col items-center gap-4 px-6 py-20 text-center text-dim">
                                    <Inbox size={28} className="text-faint" />
                                    <p className="font-mono text-[12px] uppercase tracking-[0.18em]">
                                        No applications yet
                                    </p>
                                    <p className="max-w-sm text-[13px]">
                                        They'll appear here as soon as people apply from the landing page.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto db-scroll">
                                    <table className="w-full min-w-[720px] border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-line bg-bg-2 font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
                                                <th className="w-10 px-4 py-3 text-right">#</th>
                                                <th className="px-4 py-3">Email</th>
                                                <th className="px-4 py-3">Platform</th>
                                                <th className="px-4 py-3">Why They Want In</th>
                                                <th className="px-4 py-3 whitespace-nowrap">Applied</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((r, i) => (
                                                <tr
                                                    key={r.id}
                                                    className="border-b border-hair align-top transition-colors duration-[var(--dur-fast)] last:border-0 hover:bg-bg-2"
                                                >
                                                    <td className="px-4 py-3 text-right font-mono text-[12px] text-faint tabular-nums">
                                                        {i + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <a
                                                            href={`mailto:${r.email}`}
                                                            className="font-mono text-[13px] text-text underline decoration-hair underline-offset-4 transition-colors hover:decoration-gold hover:text-gold"
                                                        >
                                                            {r.email}
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={cn(
                                                                chip({tone: "subtle", shape: "notch"}),
                                                                "text-[10px] tracking-[0.14em]",
                                                            )}
                                                        >
                                                            {PLATFORM_LABEL[r.platform] || r.platform || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="max-w-[360px] px-4 py-3 text-[13px] leading-relaxed text-dim">
                                                        {r.reason ? (
                                                            <span className="line-clamp-3 whitespace-pre-wrap">
                                                                {r.reason}
                                                            </span>
                                                        ) : (
                                                            <span className="text-faint">—</span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-faint">
                                                        {fmtDate(r.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </Reveal>
                </div>
            </section>
        );
    }

    return (
        <div className="relative min-h-dvh bg-bg text-text">
            <Nav onSignIn={onSignIn} />
            <main>{content}</main>
            <Footer onShowShortcuts={onShowShortcuts} />
        </div>
    );
}
