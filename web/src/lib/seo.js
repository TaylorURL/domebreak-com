// Head metadata per route. The site is one document with hash routes, so a
// crawler that renders JavaScript sees whichever head the route left behind —
// which means the title, description and canonical have to be set on every
// route change rather than baked once into index.html.
//
// SITE_URL is the origin every absolute URL on the page is built from: the
// canonical, the share-card image, and the @id of every structured-data node.
// A relative path in any of those resolves against nothing, because they are
// all read away from the page they came from.
export const SITE_URL = "https://domebreak.com";

export const abs = (path) => new URL(path, SITE_URL).href;

// Each route names itself. Titles run 30-60 characters and descriptions 120-160
// so neither is truncated in a result, and no two routes share either.
export const ROUTES = {
    home: {
        path: "/",
        title: "DomeBreak — Real-Time Missile Defense on the World Map",
        description:
            "Build a missile dome over real geography, plan strikes on rival nations, and run the economy paying for it. Free real-time strategy for macOS and Windows.",
        trail: [],
    },
    wiki: {
        path: "/#/wiki",
        title: "Unit Wiki — Every DomeBreak Unit and Building",
        description:
            "Cost, upkeep, build time, hit points, reach and payload for every unit and building in DomeBreak, read straight from the simulation the game runs.",
        trail: [{name: "Unit Wiki", path: "/#/wiki"}],
    },
    download: {
        path: "/#/download",
        title: "Download DomeBreak for macOS and Windows",
        description:
            "Installers for Apple Silicon, Intel Mac, and 64-bit, ARM and 32-bit Windows. DomeBreak is free to play — create an account and take command of a nation.",
        trail: [{name: "Download", path: "/#/download"}],
    },
    privacy: {
        path: "/#/privacy",
        title: "Privacy Policy — DomeBreak",
        description:
            "What DomeBreak stores when you create an account, join a match, or apply for the beta, how long it is kept, who it reaches, and how to have it deleted.",
        trail: [{name: "Privacy", path: "/#/privacy"}],
    },
    terms: {
        path: "/#/terms",
        title: "Terms of Use — DomeBreak",
        description:
            "The terms you accept by downloading DomeBreak or creating an account: the licence, conduct in multiplayer, account suspension, and the limits of the warranty.",
        trail: [{name: "Terms", path: "/#/terms"}],
    },
    contact: {
        path: "/#/contact",
        title: "Contact — DomeBreak",
        description:
            "Where to send a crash report, an account or data request, or a press and streaming enquiry about DomeBreak, and what to put in the message.",
        trail: [{name: "Contact", path: "/#/contact"}],
    },
    admin: {
        path: "/#/admin",
        title: "Beta Review — DomeBreak Admin",
        description:
            "The closed-beta application queue, open to DomeBreak admins. Every application with the platform it named and the date it arrived, newest first.",
        trail: [{name: "Admin", path: "/#/admin"}],
        noindex: true,
    },
    // A hash nothing serves. Kept out of the index rather than left to resolve
    // against the home page's canonical, which is how one address becomes many.
    notFound: {
        path: "/#/404",
        title: "Page Not Found — DomeBreak",
        description:
            "Nothing is served at this address. DomeBreak's pages are the home page, the unit wiki, and the download page for macOS and Windows.",
        trail: [],
        noindex: true,
    },
};

// BreadcrumbList turns the URL line of a result into a readable path, so it is
// emitted wherever a route sits below the home page.
export function breadcrumbLd(trail) {
    if (!trail.length) return null;
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {"@type": "ListItem", position: 1, name: "Home", item: abs("/")},
            ...trail.map((step, i) => ({
                "@type": "ListItem",
                position: i + 2,
                name: step.name,
                item: abs(step.path),
            })),
        ],
    };
}
