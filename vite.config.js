import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import {readFileSync} from "node:fs";

const {version} = JSON.parse(readFileSync(new URL("./package.json", import.meta.url)));

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {port: 5173},
    build: {target: "es2022", chunkSizeWarningLimit: 1500},
    // The client version the menu displays and the net client sends to the
    // match server for its compatibility gate.
    define: {__APP_VERSION__: JSON.stringify(version)},
});
