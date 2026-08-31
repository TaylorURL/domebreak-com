import LegalShell from "./LegalShell.jsx";
import {UPDATED, CONTACT} from "../lib/legal.js";

// One address, and what reaches a person at it. DomeBreak is run by one person,
// so there is no queue to route to and no form worth putting in front of the
// mailbox — the page exists so somebody with a crash, a takedown, or a data
// request can see where to send it and what to put in it.
export default function ContactPage(props) {
    return (
        <LegalShell
            {...props}
            eyebrow="Contact"
            title="Get in touch"
            updated={UPDATED}
            intro={`Everything below goes to ${CONTACT}. It is read by one person, so say what happened and expect a reply rather than a ticket number.`}
            sections={[
                {
                    heading: "A bug, a crash, or a match that went wrong",
                    body: [
                        "Say which platform you are on, the version in the footer of the download page, " +
                            "and what you were doing when it happened. If the game closed on its own, the " +
                            "last thing on screen before it went is the most useful sentence in the mail.",
                    ],
                },
                {
                    heading: "Your account or your data",
                    body: [
                        "Write from the address on the account. A copy of what is held, a correction, and " +
                            "deletion are all handled the same way and are covered by the privacy policy.",
                    ],
                },
                {
                    heading: "Press, streaming, and the closed beta",
                    body: [
                        "Keys, build access, and questions about what the game does go to the same address. " +
                            "Beta applications are made on the download page rather than by mail.",
                    ],
                },
            ]}
        />
    );
}
