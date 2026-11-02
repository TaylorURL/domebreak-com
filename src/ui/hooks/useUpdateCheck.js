import {useEffect, useState} from "react";
import {isUpdateAvailable} from "../../net/version.js";

// Polls the published release version and reports when this build is behind it.
// version.json resolves to the download host's latest.json, stamped as the
// release process repoints the stable installer links, so a version appears here
// only once the installer this update downloads is the one behind those links.
// This drives the UpdateOverlay prompt; the authoritative gate is the server's
// hello check — a client that never sees this (offline, blocked CDN) still can't
// join a match outdated.
const CLIENT_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null;
const UPDATE_URL = import.meta.env.VITE_UPDATE_URL || "https://domebreak.com/version.json";
const CHECK_INTERVAL_MS = 15 * 60_000;
// The URL proxies to the download host, so a check is a round trip to another
// machine, and a host that has stopped accepting connections holds the request
// open rather than refusing it. Bound the wait: a sweep that gives up is back in
// fifteen minutes, where a sweep left hanging stacks a second socket on top of
// the first and never reports anything either way.
const CHECK_TIMEOUT_MS = 10_000;

export default function useUpdateCheck() {
    const [latestVersion, setLatestVersion] = useState(null);
    useEffect(() => {
        // Dev builds churn versions meaninglessly — never nag there.
        if (!CLIENT_VERSION || import.meta.env.DEV) return;
        let live = true;
        let inFlight = null;
        const check = async () => {
            const own = new AbortController();
            inFlight = own;
            const timer = setTimeout(() => own.abort(), CHECK_TIMEOUT_MS);
            try {
                const res = await fetch(UPDATE_URL, {cache: "no-store", signal: own.signal});
                if (!res.ok) return;
                const {version} = await res.json();
                if (live && typeof version === "string") setLatestVersion(version);
            } catch {
                // Offline, unreachable, or slower than CHECK_TIMEOUT_MS — quietly
                // try again next sweep. The server's hello check is the gate that
                // matters, so a missed sweep costs a prompt, never a wrong match.
            } finally {
                clearTimeout(timer);
                if (inFlight === own) inFlight = null;
            }
        };
        check();
        const t = setInterval(check, CHECK_INTERVAL_MS);
        return () => {
            live = false;
            clearInterval(t);
            if (inFlight) inFlight.abort();
        };
    }, []);
    return {
        currentVersion: CLIENT_VERSION,
        latestVersion,
        updateAvailable: !!(CLIENT_VERSION && latestVersion && isUpdateAvailable(CLIENT_VERSION, latestVersion)),
    };
}
