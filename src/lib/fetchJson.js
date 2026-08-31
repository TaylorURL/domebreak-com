// Fetch a static JSON asset, resolving to `null` on any failure — network
// error, non-2xx status, or an unparseable body — so callers treat a missing
// asset as absent data rather than as an exception.

const memo = new Map();

// `cache: true` memoizes the in-flight promise under `path`, so several loaders
// of one asset (/assets/colors.json is read by the ownership layer, the
// political tint, and the attract sim) share a single download. The memo is
// never evicted and a `null` result is memoized too, so a load that fails once
// stays failed for the life of the page; an `opts.signal` passed by a later
// caller cannot abort an already-cached promise.
export async function loadJsonAsset(path, opts = {}) {
    const {signal, cache = false} = opts;
    if (cache && memo.has(path)) return memo.get(path);
    const p = (async () => {
        try {
            const r = await fetch(path, signal ? {signal} : undefined);
            if (!r.ok) return null;
            return await r.json();
        } catch {
            return null;
        }
    })();
    if (cache) memo.set(path, p);
    return p;
}
