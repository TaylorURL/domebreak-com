import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Marketing landing page — separate app from the game (src/). Deploys to Vercel
// with this `web/` folder as the project root. `@game` resolves to the game's
// own source so the animated hero globe reuses the real in-game engine/renderer
// (one source of truth, no copied code).
//
// The release version is deliberately absent from this build. `/version.json`
// is a rewrite to the download host's latest.json (vercel.json), which the
// release process stamps as it repoints the stable installer links, and the
// pages read it at runtime (useReleaseVersion.js). Baking package.json in here
// instead announces a version the moment it is bumped, whether or not any
// installer exists for it — which strands every desktop client on an update it
// cannot download.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    // BigInt literals are the one piece of syntax esbuild cannot rewrite, and
    // maplibre-gl's vector-tile reader uses them, so an es2017 target would
    // refuse the build outright. They sit in the lazily imported hero-globe
    // chunk, never in the entry, so declaring them available keeps the entry
    // parseable everywhere while the globe is simply skipped by an engine old
    // enough to lack BigInt.
    esbuild: {supported: {bigint: true}},
    resolve: {
        alias: {"@game": resolve(here, "../src")},
        // The game source (imported via @game from ../src) resolves its bare npm
        // imports from the game's ROOT node_modules, which isn't installed when
        // only this web workspace is (e.g. Vercel's build). Dedupe every shared
        // dependency so they all resolve from THIS app's node_modules instead —
        // this also keeps React a single instance so hooks don't break. Keep in
        // sync with the bare imports used under src/ (grep: from "<pkg>").
        dedupe: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-map-gl",
            "maplibre-gl",
            "pmtiles",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
            "lucide-react",
            "@supabase/supabase-js",
        ],
    },
    server: {
        port: 5180,
        strictPort: false,
        fs: {allow: [resolve(here, ".."), here]},
        // Stand in for the production rewrite (vercel.json) so the version the
        // pages render in dev is the released one, same as live.
        proxy: {
            "/version.json": {
                target: "https://download.domebreak.com",
                changeOrigin: true,
                rewrite: () => "/latest.json",
            },
        },
    },
    // The bundle is the only thing that makes this site interactive, and a
    // SyntaxError in it is fatal to the whole file: nothing of the app runs,
    // on any browser whose parser does not know the syntax. es2022 left
    // `?.`, `??` and `||=` in the emitted chunks — including the preload
    // helper Vite puts at the top of the entry — which the parser in a
    // 2018-era Android browser (modules yes, optional chaining no) refuses
    // outright. es2017 is understood by every engine that can load a module
    // at all, and esbuild lowers the newer syntax into it, so the page boots
    // there and stays identical on a current browser.
    build: {
        target: "es2017",
        rollupOptions: {
            output: {
                // React and the animation runtime move to their own file. In one
                // chunk with the application code every deploy changes the hash of
                // bytes that did not change, and a returning visitor downloads the
                // framework again for a copy edit.
                manualChunks(id) {
                    if (!id.includes("node_modules")) return;
                    if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
                    if (/[\\/]node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id))
                        return "motion";
                },
            },
        },
    },
});
