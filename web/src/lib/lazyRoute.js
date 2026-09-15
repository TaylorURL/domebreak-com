import {lazy} from "react";

// Every route arrives as its own hashed chunk, and a deploy replaces the whole
// set at once: the names carry the build's content hash, so the files a page
// loaded from are gone the moment the next deploy finishes. A visit that was
// already open then asks for a chunk that no longer exists, the dynamic import
// rejects, and React turns that into a render error — which, over a routed tree
// with no boundary, unmounts the entire page instead of the one route.
//
// Three things answer that here, in order. The import is retried, because a
// chunk that missed once often answers on the next request as the deploy
// settles across the edge. A retry that still fails is checked against the
// entry script the server is handing out now: a name that no longer matches the
// one this document booted from is proof the build moved underneath it, and a
// single reload picks up the new chunk names. Whatever is left after that is a
// load that is not coming back, and it reaches the boundary as an error to
// render rather than as a blank screen.

const RELOADED_KEY = "db:chunk-reloaded";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The module script an HTML document boots from. Vite writes exactly one, and
// its file name carries the hash of the build that produced it.
export function entryScriptSrc(html) {
    for (const tag of String(html || "").match(/<script\b[^>]*>/gi) || []) {
        if (!/type\s*=\s*["']module["']/i.test(tag)) continue;
        const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag);
        if (src) return src[1];
    }
    return null;
}

function runningEntryScriptSrc(doc) {
    const el = doc && doc.querySelector ? doc.querySelector('script[type="module"][src]') : null;
    return el ? el.getAttribute("src") : null;
}

// Whether the server is serving a different build than the one running. Any
// doubt answers false: a reload is only worth taking a reader off their page
// for when there is something new to load.
export async function buildHasMoved({fetchImpl, doc} = {}) {
    const request = fetchImpl || (typeof fetch === "function" ? fetch : null);
    const document_ = doc || (typeof document !== "undefined" ? document : null);
    const running = runningEntryScriptSrc(document_);
    if (!request || !running) return false;
    try {
        const res = await request("/", {cache: "no-store"});
        if (!res.ok) return false;
        const served = entryScriptSrc(await res.text());
        return Boolean(served) && served !== running;
    } catch {
        return false;
    }
}

export async function importWithRetry(load, {attempts = 3, delay = 350, sleep = wait} = {}) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await load();
        } catch (err) {
            lastError = err;
            if (attempt < attempts - 1) await sleep(delay * (attempt + 1));
        }
    }
    throw lastError;
}

// One reload per visit. Without the flag a reader whose chunk is missing for
// any other reason would be reloaded into the same failure over and over, and
// storage that refuses to hold the flag is treated as no reload at all.
function reloadOnce() {
    try {
        if (window.sessionStorage.getItem(RELOADED_KEY)) return false;
        window.sessionStorage.setItem(RELOADED_KEY, "1");
    } catch {
        return false;
    }
    window.location.reload();
    return true;
}

export default function lazyRoute(load) {
    return lazy(async () => {
        try {
            return await importWithRetry(load);
        } catch (err) {
            if ((await buildHasMoved()) && reloadOnce()) {
                // The page is on its way out. Resolving nothing holds the
                // route's placeholder up until it goes, so the reader never
                // sees an error screen for a reload already under way.
                return new Promise(() => {});
            }
            throw err;
        }
    });
}
