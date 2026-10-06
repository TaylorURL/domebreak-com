import LegalShell from "./LegalShell.jsx";
import {UPDATED, CONTACT} from "../lib/legal.js";

export default function PrivacyPage(props) {
    return (
        <LegalShell
            {...props}
            eyebrow="Privacy"
            title="Privacy Policy"
            updated={UPDATED}
            intro={
                "DomeBreak is made and run by one person. This page says what the game and this site " +
                "store about you, why, and how to get rid of it."
            }
            sections={[
                {
                    heading: "What is collected",
                    body: [
                        "An account holds the email address you sign up with and the display name you " +
                            "choose. Signing in is handled by Supabase Auth, which stores a password hash. The " +
                            "password itself is never held in a readable form and is never visible here.",
                        "Playing online stores what a match needs to run and to be rejoined: the lobby you " +
                            "are seated in, the nation you took, and the state of the match while it lasts. " +
                            "Finished matches keep a result row so standings survive a restart.",
                        "Applying for the closed beta stores the address you gave, the platform you named, " +
                            "anything you wrote in the reason field, and the browser string the request " +
                            "arrived with. The waitlist stores an address and nothing else.",
                    ],
                },
                {
                    heading: "What it is used for",
                    body: [
                        "To run your account, to put you in matches with other players, and to answer beta " +
                            "applications. Nothing is used to build a profile of you, and nothing is sold.",
                        "There is no advertising on this site and no tracking cookie. Visits are counted by " +
                            "TaylorURL, which builds and runs the site, on its own collector. It records " +
                            "the page, the site you came from, how long the page was open, your browser, device " +
                            "and screen size, an approximate location worked out from your connection, and a " +
                            "random visitor number kept in browser storage. It never records a name, an email " +
                            "address or anything typed into a form.",
                        "Besides that visitor number, the only browser storage the site sets is the session " +
                            "that keeps you signed in.",
                    ],
                },
                {
                    heading: "Who else sees it",
                    body: [
                        "Supabase hosts the database and the authentication service. Vercel serves this " +
                            "site. A match server on a rented VPS holds live match state while a match is in " +
                            "progress. Each of those sees only what it needs to do that job.",
                        "Browser errors on this site are reported to a private collector so faults get " +
                            "fixed. A report carries the error, the page it happened on, and the browser " +
                            "string. It never carries the contents of a form or anything identifying you.",
                        "Nothing is shared with anybody else except where the law requires it.",
                    ],
                },
                {
                    heading: "How long it is kept",
                    body: [
                        "Account and profile rows are kept until you ask for the account to be deleted. " +
                            "Live match state is discarded when the match ends. Beta applications are kept " +
                            "until the beta closes.",
                    ],
                },
                {
                    heading: "Getting your data out or deleted",
                    body: [
                        `Write to ${CONTACT} from the address on the account and say what you want: a copy ` +
                            "of what is held, a correction, or deletion. Deletion removes the account, the " +
                            "profile, and every row keyed to it, and it cannot be undone.",
                    ],
                },
                {
                    heading: "Children",
                    body: [
                        "DomeBreak is not directed at children under 13 and accounts are not knowingly " +
                            `created for them. If one has been, write to ${CONTACT} and it will be removed.`,
                    ],
                },
                {
                    heading: "Changes",
                    body: [
                        "If this policy changes, the date at the top of this page moves with it. A change " +
                            "that affects what is collected or who sees it will be said plainly here rather " +
                            "than folded into the wording.",
                    ],
                },
            ]}
        />
    );
}
