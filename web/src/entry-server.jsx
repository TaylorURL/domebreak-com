import {renderToStaticMarkup} from "react-dom/server";
import App from "./App.jsx";

// The landing page as a build can know it: no window, no hash, no stored
// session — the home route, signed out. scripts/prerender.mjs writes what this
// returns into the document, which is what lets the first paint be the
// browser's own rather than something React has to arrive before.
//
// Static markup, not a hydration payload. main.jsx still mounts with
// createRoot, so React renders the page from nothing the way it always has and
// replaces what is there; the prerendered nodes are pixels for the interval
// before the bundle lands and are never adopted. That is deliberate — a hash
// route, a stored session and a media query all read differently in a browser
// than they can at build time, and hydrating over that would raise a mismatch
// on the visits that have any of them.
export function render() {
    return renderToStaticMarkup(<App />);
}
