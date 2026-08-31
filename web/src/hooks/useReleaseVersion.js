import {useEffect, useState} from "react";

// A rewrite to the download host's latest.json (vercel.json), which the release
// process stamps at the moment it repoints the stable installer links. The game
// client polls the same URL to decide whether to update
// (src/ui/hooks/useUpdateCheck.js).
const VERSION_URL = "/version.json";

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

        const load = async () => {
            if (resolved || controller) return;
            // The rewrite proxies to another host and revalidates on every hit,
            // so the round trip regularly outlasts a short visit on a phone.
            // Holding the controller is the difference between cancelling the
            // request and leaving the browser to tear it down, and only the
            // first of those is distinguishable from a host that could not be
            // reached.
            const own = new AbortController();
            controller = own;
            try {
                const res = await fetch(VERSION_URL, {cache: "no-store", signal: own.signal});
                if (!res.ok) return;
                const data = await res.json();
                if (live && typeof data?.version === "string") {
                    resolved = true;
                    setVersion(data.version);
                }
            } catch {
                // Download host unreachable — the pages render without a version
                // rather than naming one that might not be downloadable.
            } finally {
                if (controller === own) controller = null;
            }
        };

        const stop = () => {
            if (!controller) return;
            controller.abort();
            controller = null;
        };

        // WebKit drops in-flight requests when a page is hidden or navigated away
        // from, so the request is cancelled ahead of that and reissued if the
        // visitor comes back before a version has resolved.
        const onVisibility = () => {
            if (document.visibilityState === "hidden") stop();
            else if (live) load();
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
