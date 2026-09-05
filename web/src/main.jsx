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
