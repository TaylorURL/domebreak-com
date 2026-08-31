import {useEffect} from "react";
import {ROUTES, abs, breadcrumbLd} from "../lib/seo.js";

// The head this hook writes has to be the head index.html already declares, not
// a second copy of it. Appending is how a document ends up with two canonicals
// and two descriptions, and a crawler reading the first one gets the home
// page's metadata on every route. So each tag is looked up by what it is, and
// only created when the document does not already carry it.
function upsert(selector, make, attrs) {
    let el = document.head.querySelector(selector);
    if (!el) {
        el = make();
        document.head.appendChild(el);
    }
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

function setMeta(key, attr, content) {
    upsert(`meta[${attr}="${key}"]`, () => document.createElement("meta"), {[attr]: key, content});
}

// The breadcrumb island is the one tag that belongs to the route rather than to
// the document, so it is tagged and replaced wholesale on every route change.
const CRUMB = "data-breadcrumb";

// Apply one route's head: title, description, canonical, the Open Graph and
// Twitter card set, its indexing policy, and a breadcrumb island when the route
// sits below the home page.
export default function useDocumentMeta(routeKey) {
    useEffect(() => {
        const route = ROUTES[routeKey] || ROUTES.home;
        const url = abs(route.path);

        document.title = route.title;
        setMeta("description", "name", route.description);
        setMeta("robots", "name", route.noindex ? "noindex, follow" : "index, follow, max-image-preview:large");
        upsert('link[rel="canonical"]', () => document.createElement("link"), {rel: "canonical", href: url});

        setMeta("og:url", "property", url);
        setMeta("og:title", "property", route.title);
        setMeta("og:description", "property", route.description);
        setMeta("twitter:title", "name", route.title);
        setMeta("twitter:description", "name", route.description);

        const old = document.head.querySelector(`script[${CRUMB}]`);
        if (old) old.remove();
        const crumbs = breadcrumbLd(route.trail);
        if (crumbs) {
            const script = document.createElement("script");
            script.type = "application/ld+json";
            script.setAttribute(CRUMB, "");
            script.textContent = JSON.stringify(crumbs);
            document.head.appendChild(script);
        }
    }, [routeKey]);
}
