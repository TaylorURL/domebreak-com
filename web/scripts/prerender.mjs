// Turns the built document into one the browser can paint on its own.
//
// Everything on this site is drawn by React, so a document shipping an empty
// #root paints nothing at all until the bundle has been fetched, parsed and
// run. That is not a bundle-size problem — the wire goes quiet well before the
// screen changes — it is that the first paint has nothing to be a paint of. Two
// edits fix it, and only together: the home route is rendered here at build
// time and its markup goes in the document, and the stylesheet that would
// otherwise block that markup from painting goes in with it.
//
// Nothing is hydrated. main.jsx mounts with createRoot exactly as before and
// React replaces what it finds, so no route, session or media query read at
// build time can disagree with the browser's and raise a mismatch. See
// src/entry-server.jsx.
import {readFile, rm, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

// The production renderer, not the development one: this markup ships.
process.env.NODE_ENV = "production";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "dist");
const doc = resolve(dist, "index.html");
const bundle = resolve(root, ".prerender/entry-server.js");

// index.html carries the slot, so the shape of the document stays readable in
// the file a person edits rather than being inferred by a regular expression.
const SLOT = "<!--prerender-->";

// Two strings from opposite ends of the landing page: the doctrine anchor sits
// deep inside it and the attribution rail is the last thing App renders.
// Getting a string back is not evidence the page is in it — anything that
// suspends comes back as App's Suspense fallback, an empty full-height div — so
// the build is held to the markup rather than to the call having returned.
const PROOF = ['id="doctrine"', "data-taylorurl-bar"];

const {render} = await import(pathToFileURL(bundle).href);
const markup = render();

for (const proof of PROOF) {
    if (markup.includes(proof)) continue;
    throw new Error(`The prerendered landing page is missing ${proof}; it did not render in full.`);
}

const html = await readFile(doc, "utf8");
if (!html.includes(SLOT)) throw new Error(`index.html no longer carries the ${SLOT} slot.`);

// display:contents so the wrapper draws no box of its own — the prerendered
// page lays out exactly as it will once React owns it. The attribute is what
// the guard in index.html removes on a route that is not the home page.
let out = html.replace(SLOT, `<div data-prerendered style="display:contents">${markup}</div>`);

// The one stylesheet blocks the first paint, and with the page now in the
// document that block is the whole of what is left in front of it: the browser
// has the markup in hand and waits a round trip for the rules before it may
// draw a pixel of it. Inlining the file whole is what removes that, and it is
// the only version of this with nothing to get wrong — an extracted "critical"
// subset is a guess about which rules the first screen needs, and a rule it
// guesses wrong lands as a flash of the page in the wrong shape, which is worse
// than the round trip it saves. Whole, there is no subset and no flash.
//
// The cost is that the rules stop being a separately cached file. On a site
// whose router is the hash there is one document per visit to pay it on, and
// what it costs there is the compressed sheet: a returning visitor downloads it
// again rather than reading assets/index-<hash>.css out of the immutable cache
// vercel.json gives it.
const link = /<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/.exec(out);
if (!link) throw new Error("index.html has no built stylesheet to inline.");
const css = await readFile(resolve(dist, link[1]), "utf8");
out = out.replace(link[0], `<style>${css}</style>`);
await rm(resolve(dist, link[1]), {force: true});

await writeFile(doc, out);
await rm(resolve(root, ".prerender"), {recursive: true, force: true});

console.log(`prerendered the landing page and inlined ${link[1]} into dist/index.html`);
