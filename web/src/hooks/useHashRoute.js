import {useEffect, useState} from "react";

// Minimal hash router — reads window.location.hash and re-renders on change.
// The whole marketing site is a single page, so this saves us pulling in a full
// router just to swap in the Wiki. Returns the current hash (empty string on
// the landing page, "#/wiki" and friends elsewhere) and a `navigate` helper.
export function useHashRoute() {
    const [hash, setHash] = useState(() => window.location.hash);

    useEffect(() => {
        const onHash = () => setHash(window.location.hash);
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);

    // Navigate by plain hash assignment: the browser fires hashchange itself
    // (re-rendering via the listener above) and each route gets a history
    // entry, so Back/Forward keep working.
    function navigate(target) {
        if (target === window.location.hash) return;
        window.location.hash = target;
    }

    return [hash, navigate];
}

// True while any wiki route is active — the App uses this to swap the shell for
// the Wiki page. Accepts either the raw hash or nothing (reads window).
export function isWikiRoute(hash = window.location.hash) {
    return hash.startsWith("#/wiki");
}

export function isDownloadRoute(hash = window.location.hash) {
    return hash.startsWith("#/download");
}

export function isAdminRoute(hash = window.location.hash) {
    return hash.startsWith("#/admin");
}

export function isPrivacyRoute(hash = window.location.hash) {
    return hash.startsWith("#/privacy");
}

export function isTermsRoute(hash = window.location.hash) {
    return hash.startsWith("#/terms");
}

export function isContactRoute(hash = window.location.hash) {
    return hash.startsWith("#/contact");
}
