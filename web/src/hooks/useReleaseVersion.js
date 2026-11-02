import {useEffect, useState} from "react";

// Proxied to the download host's latest.json by /api/published-version
// (vercel.json), which the release process stamps at the moment it repoints the
// stable installer links. The game client polls the same URL to decide whether
// to update (src/ui/hooks/useUpdateCheck.js).
const VERSION_URL = "/version.json";

// The request crosses to another machine, so bound it here as well as in the
// function behind it: whichever side gives up first, the page stops holding an
// open request for a line of text it renders fine without.
const TIMEOUT_MS = 5000;

// A phone loses a background request as a matter of routine — a radio asleep, a
// tab in the background, a handover between cells — and one lost request used to
// leave the download buttons unlabelled for the rest of the visit, because
// nothing asked again. Back off and try a few more times, then stop; this is one
// line of text, not something worth polling for the length of a visit.
const RETRY_DELAYS_MS = [2000, 8000, 30000];

// The version players can actually install, or null until it resolves — render
// the version only when this is set.
//
// This is the version behind the download buttons, not the version the site was
// built from. The two differ for the whole window between a version bump landing
// on main and that release's installers going out, which is exactly when naming
// the newer number would send players after a build that does not exist.
export default function useReleaseVersion() {
    const [version, setVersion] = useState(null);
    useEffect(() => {
        let live = true;
        let resolved = false;
        let controller = null;
        let paused = false;
        let attempt = 0;
        let retry = null;

        const schedule = () => {
            if (!live || resolved || paused || retry !== null) return;
            const delay = RETRY_DELAYS_MS[attempt];
            if (delay === undefined) return;
            attempt += 1;
            retry = setTimeout(() => {
                retry = null;
                load();
            }, delay);
        };

        const load = async () => {
            if (!live || resolved || controller) return;
            // The rewrite proxies to another host and revalidates on every hit,
            // so the round trip regularly outlasts a short visit on a phone.
            // Holding the controller is the difference between cancelling the
            // request and leaving the browser to tear it down, and only the
            // first of those is distinguishable from a host that could not be
            // reached.
            const own = new AbortController();
            controller = own;
            const timer = setTimeout(() => own.abort(), TIMEOUT_MS);
            try {
                const res = await fetch(VERSION_URL, {
                    cache: "no-store",
                    signal: own.signal,
                    // A background check for the published version is handled
                    // here in full: it changes nothing on screen when it fails
                    // and the next attempt is already scheduled. Telling the
                    // reporter about it would file the same dropped mobile
                    // request over and over, and spend a per-page report budget
                    // that a fault a visitor can actually see needs. See the
                    // fetch wrapper in web/index.html.
                    reportFailures: false,
                });
                if (!res.ok) {
                    schedule();
                    return;
                }
                const data = await res.json();
                if (!live) return;
                if (typeof data?.version === "string") {
                    resolved = true;
                    setVersion(data.version);
                } else {
                    schedule();
                }
            } catch {
                // Download host unreachable, or slower than TIMEOUT_MS — the
                // pages render without a version rather than naming one that
                // might not be downloadable, and the retry above asks again.
                schedule();
            } finally {
                clearTimeout(timer);
                if (controller === own) controller = null;
            }
        };

        const stop = () => {
            if (retry !== null) {
                clearTimeout(retry);
                retry = null;
            }
            if (!controller) return;
            paused = true;
            controller.abort();
            controller = null;
        };

        // WebKit drops in-flight requests when a page is hidden or navigated away
        // from, so the request is cancelled ahead of that and reissued if the
        // visitor comes back before a version has resolved.
        const onVisibility = () => {
            if (document.visibilityState === "hidden") stop();
            else if (live) {
                paused = false;
                load();
            }
        };

        load();
        window.addEventListener("pagehide", stop);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            live = false;
            stop();
            window.removeEventListener("pagehide", stop);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);
    return version;
}
