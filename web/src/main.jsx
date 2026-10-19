import React from "react";
import {createRoot} from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// The document already holds the landing page when it gets here — the build
// renders it in (scripts/prerender.mjs) so the first paint is the browser's own
// rather than something React has to arrive before. This mounts over that markup
// instead of hydrating it, which is why nothing rendered at build time has to
// agree with what a browser reads. src/entry-server.jsx has the reasoning.
createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);

// Tells the boot guard in index.html that this bundle arrived and ran, so it
// stands down. Reaching this line is the whole of what it needs to know: every
// failure the guard exists for is one where nothing in this file runs at all.
window.__domebreakBooted = true;
