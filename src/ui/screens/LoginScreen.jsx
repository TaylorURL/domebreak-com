import {useState} from "react";
import {signIn, signUp} from "../../account/api.js";
import {button, input, label, segment, segmentItem} from "../lib/variants.js";
import {cn} from "../lib/cn.js";

// Full-screen auth gate. Shares the exact command-rail shell as StartMenu and
// LobbyScreen — a slim left console over the live attract globe (rendered behind
// this screen by App) — so signing in visually morphs the login rail straight
// into the main menu rail with the DOMEBREAK title never moving. No navigation
// here: App's onAuth subscription takes over once the session updates, so this
// component only ever talks to the account API and reports its own busy/error
// state.
export default function LoginScreen() {
    const [mode, setMode] = useState("signin"); // "signin" | "signup"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const validSignup = username.trim().length >= 3 && username.trim().length <= 24 && password.length >= 8;
    const canSubmit = !!email.trim() && !!password && (mode === "signin" || validSignup) && !busy;

    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true);
        setError(null);
        if (mode === "signin") {
            const r = await signIn(email.trim(), password);
            if (r.error) {
                setError(r.error);
                setBusy(false);
            }
            // success: onAuth fires in App, this screen unmounts
            return;
        }
        const r = await signUp(email.trim(), password, username.trim());
        if (r.error) {
            setError(r.error);
            setBusy(false);
            return;
        }
        // Autoconfirm may or may not hand back a session on signUp — sign in
        // right after so both cases land on an authenticated session.
        const r2 = await signIn(email.trim(), password);
        if (r2.error) {
            setError(r2.error);
            setBusy(false);
        }
    };

    // Switch modes from the segmented toggle; clearing the error avoids carrying
    // a "wrong password" message into the create-account form. No-op if already
    // on the requested mode.
    const selectMode = (m) => {
        if (m === mode || busy) return;
        setMode(m);
        setError(null);
    };

    return (
        // Command rail: identical structural shell to StartMenu so the live
        // attract globe owns the center of the screen, uncovered.
        <div className="absolute inset-0 z-10 block overflow-hidden p-0">
            <div className="absolute inset-0 -z-1 bg-[radial-gradient(ellipse_120%_100%_at_66%_46%,transparent_46%,rgba(0,0,0,0.5)_82%,rgba(0,0,0,0.8)_100%)]" />
            <aside
                className="absolute top-0 left-0 bottom-0 w-96 max-w-[88vw] flex flex-col overflow-y-auto pt-[46px] pr-[46px] pb-[26px] pl-10 text-left pointer-events-none animate-[dbRailIn_520ms_var(--ease-out-db)_both] motion-reduce:animate-none
                before:content-[''] before:absolute before:inset-0 before:-z-1 before:bg-[linear-gradient(90deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.64)_52%,rgba(0,0,0,0)_100%)] before:backdrop-blur-[9px] before:[mask-image:linear-gradient(90deg,#000_58%,transparent_100%)]"
            >
                <div className="mb-[30px]">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-medium text-faint">
                        <span className="db-led db-led-warn" />
                        Authorization Required
                    </div>
                    <h1 className="font-semibold text-[46px] tracking-[0.08em] leading-[44px] text-dim">
                        DOME
                        <span className="block text-text">BREAK</span>
                    </h1>
                    <p className="text-dim text-[13px] mt-3 mb-0">Global missile command</p>
                </div>

                <form
                    className="pointer-events-auto flex flex-col animate-[dbRowIn_460ms_var(--ease-out-db)_both] motion-reduce:animate-none"
                    onSubmit={submit}
                    aria-labelledby="db-login-title"
                >
                    <h2 className="sr-only" id="db-login-title">
                        {mode === "signin" ? "Sign in" : "Create account"}
                    </h2>

                    {/* Segmented mode switch: both options are visible up front, so
                        signing up is never hidden behind a link under the form. */}
                    <div className={cn(segment(), "mb-[22px] flex")} role="tablist" aria-label="Authentication mode">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === "signin"}
                            disabled={busy}
                            onClick={() => selectMode("signin")}
                            className={cn(segmentItem({on: mode === "signin"}), "flex-1 h-9 font-sans text-[12px]")}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === "signup"}
                            disabled={busy}
                            onClick={() => selectMode("signup")}
                            className={cn(segmentItem({on: mode === "signup"}), "flex-1 h-9 font-sans text-[12px]")}
                        >
                            Create Account
                        </button>
                    </div>

                    <label className={label()} htmlFor="db-login-email">
                        Email
                    </label>
                    <input
                        id="db-login-email"
                        className={input()}
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={busy}
                        aria-invalid={!!error}
                        aria-describedby={error ? "db-login-err" : undefined}
                    />

                    {mode === "signup" && (
                        <>
                            <label className={cn(label(), "mt-4")} htmlFor="db-login-username">
                                Username
                            </label>
                            <input
                                id="db-login-username"
                                className={input()}
                                maxLength={24}
                                autoComplete="username"
                                placeholder="3-24 characters"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={busy}
                            />
                        </>
                    )}

                    <label className={cn(label(), "mt-4")} htmlFor="db-login-password">
                        Password
                    </label>
                    <input
                        id="db-login-password"
                        className={input()}
                        type="password"
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        placeholder={mode === "signup" ? "8+ characters" : undefined}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={busy}
                        aria-invalid={!!error}
                        aria-describedby={error ? "db-login-err" : undefined}
                    />

                    <div aria-live="assertive">
                        {error && (
                            <p
                                className="text-danger bg-[rgba(224,87,79,0.12)] border border-danger px-3 py-2 text-[12.5px] mt-3.5 mb-0"
                                id="db-login-err"
                            >
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        className={cn(button({variant: "primary"}), "block w-full mt-[18px]")}
                        type="submit"
                        disabled={!canSubmit}
                    >
                        {busy ? "Standing by…" : mode === "signin" ? "Sign In" : "Create Account"}
                    </button>

                    <p className="text-faint text-[11px] leading-[1.5] mt-4 mb-0">
                        {mode === "signin"
                            ? "Your account carries your callsign, match history, and career stats across every deployment."
                            : "One free account. There is no confirmation email, so you deploy the moment you enlist."}
                    </p>
                </form>
            </aside>
        </div>
    );
}
