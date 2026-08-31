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
    build: {
        target: "es2022",
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
