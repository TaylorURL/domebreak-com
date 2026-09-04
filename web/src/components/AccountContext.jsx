import {useCallback, useEffect, useRef, useState} from "react";
import {AccountCtx} from "../lib/accountStore.js";

// Shared DomeBreak game-account state. The account module (which pulls in
// supabase-js, ~215 KB) is loaded LAZILY, and only by a visit that has an
// account to resolve.
//
// supabase-js persists its session under this key (see account.js). A visitor
// with no entry there has never signed in on this browser, so there is no
// session for the module to report and nothing for it to refresh — loading it
// would spend a fifth of a megabyte of parse and execute to be told "signed
// out", which is what the nav already shows. Such a visit resolves signed-out
// from the key alone and the module never loads until something actually needs
// it: a sign-in, a sign-up, or the admin beta list.
const SESSION_KEY = "domebreak.auth";

// Whether this browser holds a stored session. Storage that refuses to be read
// (private mode, storage disabled) answers yes, so the module still loads and
// the account resolves the way it always did — the fast path is an
// optimisation for a visit known to have nothing to fetch, never a guess.
function hasStoredSession() {
    try {
        return window.localStorage.getItem(SESSION_KEY) !== null;
    } catch {
        return true;
    }
}

export function AccountProvider({children}) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    // A visit with no stored session is not waiting on anything, so it is not
    // loading — the nav renders its signed-out state on the first paint rather
    // than passing through a pending one it will never leave.
    const [loading, setLoading] = useState(hasStoredSession);

    // Cache the dynamic import so every caller shares one module instance.
    const modRef = useRef(null);
    const livingRef = useRef(null);
    const aliveRef = useRef(true);
    const offRef = useRef(null);

    // Load the account module and, the first time, subscribe to auth changes and
    // read the current session. Everything that touches the account goes through
    // here, so the subscription is always in place before a sign-in can fire it —
    // whether the module was loaded on load or on the click that needed it.
    const ensureLive = useCallback(() => {
        livingRef.current ||= (async () => {
            const a = (modRef.current ||= await import("../lib/account.js"));
            if (!aliveRef.current) return a;
            const hydrate = async (s) => {
                if (!s) {
                    setProfile(null);
                    setStats(null);
                    return;
                }
                const [p, st] = await Promise.all([a.fetchProfile(), a.fetchStats()]);
                if (!aliveRef.current) return;
                setProfile(p);
                setStats(st);
            };
            try {
                // The first read of the session is the one every gated view waits
                // on, so it is taken from the auth server rather than from local
                // storage: a stale or edited token in storage would otherwise
                // render the signed-in shell before any request refused it.
                const s = await a.getUser();
                if (!aliveRef.current) return a;
                setSession(s);
                await hydrate(s);
                if (s) a.touch();
                // onAuthStateChange hands back the stored session; only its user
                // is kept, so this state holds the same shape whichever path set
                // it. A sign-out arrives here as null and clears it.
                offRef.current = a.onAuth(async (ns) => {
                    if (!aliveRef.current) return;
                    const user = ns?.user ?? null;
                    setSession(user);
                    await hydrate(user);
                });
            } catch {
                // A misconfigured or unreachable account backend must not leave the
                // app stuck "loading" forever — fail closed to a signed-out state so
                // gated views (e.g. Download) render their signed-out path.
                if (aliveRef.current) setSession(null);
            } finally {
                if (aliveRef.current) setLoading(false);
            }
            return a;
        })();
        return livingRef.current;
    }, []);

    useEffect(() => {
        aliveRef.current = true;
        let id = null;
        // A visit carrying no stored session has already settled signed-out, so
        // the module is left unloaded until something asks for it.
        if (hasStoredSession()) {
            id =
                "requestIdleCallback" in window
                    ? window.requestIdleCallback(() => ensureLive(), {timeout: 2500})
                    : setTimeout(() => ensureLive(), 400);
        }
        // A sign-in in another tab writes the key this decided on. Pick it up so
        // the two tabs still agree, the same way the auth subscription did when
        // it was always running.
        const onStorage = (e) => {
            if (e.key === SESSION_KEY && e.newValue) ensureLive();
        };
        window.addEventListener("storage", onStorage);
        return () => {
            aliveRef.current = false;
            offRef.current?.();
            window.removeEventListener("storage", onStorage);
            if (id === null) return;
            if ("cancelIdleCallback" in window) window.cancelIdleCallback(id);
            else clearTimeout(id);
        };
    }, [ensureLive]);

    const value = {
        session,
        profile,
        stats,
        loading,
        signedIn: !!session,
        isAdmin: !!profile?.is_admin,
        listBeta: async () => (await ensureLive()).listBeta(),
        signIn: async (...a) => (await ensureLive()).signIn(...a),
        signUp: async (...a) => (await ensureLive()).signUp(...a),
        signOut: async () => {
            await (await ensureLive()).signOut();
            setSession(null);
            setProfile(null);
            setStats(null);
        },
    };
    return <AccountCtx.Provider value={value}>{children}</AccountCtx.Provider>;
}
