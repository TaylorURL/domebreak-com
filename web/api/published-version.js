// `/version.json` is answered here rather than rewritten straight at the
// download host (see the rewrite in vercel.json). A router rewrite to an
// external target carries no timeout this project can set, so when that host
// stops accepting connections the router holds the request open until it gives
// up on its own: the browser sees a request that never completed and rejects
// with a bare "Failed to fetch", indistinguishable from the visitor's own
// connection dropping. Proxying through a function of our own bounds the wait
// and always answers with JSON, so the fetch resolves and the callers read a
// status code instead of catching an exception.
//
// The body is the download host's latest.json unchanged: it names the version
// behind the stable installer links, and stamping it is the last step of a
// release (scripts/ship-dist.sh). Nothing here invents a version — announcing
// one no installer exists for is the failure this whole path is shaped to
// avoid.
const LATEST_URL = "https://download.domebreak.com/latest.json";

// A cold round trip to the download host fits inside this comfortably. Past it
// the host is not answering, and waiting longer only keeps a phone holding an
// open request for a line of text the page renders fine without.
const TIMEOUT_MS = 3000;

export default async function handler(request, response) {
    // Read cross-origin by the desktop client's update check, so the permissive
    // origin is load-bearing rather than decorative; and never cached, because a
    // cached answer would name a release that has stopped being the current one.
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");

    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), TIMEOUT_MS);
    try {
        const upstream = await fetch(LATEST_URL, {cache: "no-store", signal: stop.signal});
        if (!upstream.ok) {
            response.status(502).json({error: "upstream", status: upstream.status});
            return;
        }
        response.status(200).json(await upstream.json());
    } catch {
        // Unreachable, slower than TIMEOUT_MS, or answering something that is not
        // JSON. Answering 503 keeps this a completed request: the pages drop the
        // version line and the update check tries again on its next sweep,
        // neither of which needs an exception thrown at it.
        response.status(503).json({error: "unavailable"});
    } finally {
        clearTimeout(timer);
    }
}
