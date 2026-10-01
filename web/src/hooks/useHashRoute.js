import {useEffect, useState} from "react";

// The address the build-time prerender renders at: no window, and the home page
// is what the document is prerendered as. A hash never reaches a server anyway,
// so the empty string is not a stand-in here — it is the whole of what the
// address bar can be known to hold before the browser has the document.
function currentHash() {
    return typeof window === "undefined" ? "" : window.location.hash;
}

// Minimal hash router — reads window.location.hash and re-renders on change.
// The whole marketing site is a single page, so this saves us pulling in a full
// router just to swap in the Wiki. Returns the current hash (empty string on
// the landing page, "#/wiki" and friends elsewhere) and a `navigate` helper.
export function useHashRoute() {
    const [hash, setHash] = useState(currentHash);

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

// The home page answers for the bare address, for its in-page anchors (#doctrine,
// #play), and for the home route spelled out, #/ or #/home — the address a
// "Back to the Home Page" link writes. Any other #/ hash names a route of its
// own. index.html's prerender guard makes the same call before the bundle runs.
export function isHomeRoute(hash = currentHash()) {
    return !hash.startsWith("#/") || /^#\/(home\/?)?$/.test(hash);
}

// True while any wiki route is active — the App uses this to swap the shell for
// the Wiki page. Accepts either the raw hash or nothing (reads window).
export function isWikiRoute(hash = currentHash()) {
    return hash.startsWith("#/wiki");
}

export function isDownloadRoute(hash = currentHash()) {
    return hash.startsWith("#/download");
}

export function isAdminRoute(hash = currentHash()) {
    return hash.startsWith("#/admin");
}

export function isPrivacyRoute(hash = currentHash()) {
    return hash.startsWith("#/privacy");
}

export function isTermsRoute(hash = currentHash()) {
    return hash.startsWith("#/terms");
}

export function isContactRoute(hash = currentHash()) {
    return hash.startsWith("#/contact");
}
