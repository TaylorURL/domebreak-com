import LegalShell from "./LegalShell.jsx";
import {UPDATED, CONTACT} from "../lib/legal.js";

export default function TermsPage(props) {
    return (
        <LegalShell
            {...props}
            eyebrow="Terms"
            title="Terms of Use"
            updated={UPDATED}
            intro={
                "These terms cover downloading DomeBreak, creating an account, and playing online. " +
                "Using any of the three means accepting them."
            }
            sections={[
                {
                    heading: "The licence",
                    body: [
                        "DomeBreak is free to download and play. You get a personal, non-exclusive licence " +
                            "to install and run it on machines you control. You may not sell it, rent it, " +
                            "repackage it, or pass off a modified build as the original.",
                        "The game, its artwork, its map data and its name stay the property of their owner. " +
                            "Nothing here transfers any of that to you.",
                    ],
                },
                {
                    heading: "Your account",
                    body: [
                        "One person, one account. Keep your password to yourself: anything done through " +
                            "your account is treated as done by you.",
                        "Give an address you can actually receive mail at — it is the only route back into " +
                            "an account you have lost the password to.",
                    ],
                },
                {
                    heading: "Conduct in multiplayer",
                    body: [
                        "Play the game as it is written. Do not use modified clients, automation, or " +
                            "anything that reads or writes match state outside the game. Do not attack the " +
                            "servers or attempt to reach data belonging to another player.",
                        "Harassment of other players, and display names chosen to harass, are grounds for " +
                            "removal of the name or of the account.",
                    ],
                },
                {
                    heading: "Suspension",
                    body: [
                        "An account that breaks these terms may be suspended or deleted, with notice where " +
                            "notice is practical and without it where the servers are being attacked. You " +
                            `may close your own account at any time by writing to ${CONTACT}.`,
                    ],
                },
                {
                    heading: "Availability",
                    body: [
                        "DomeBreak is offered as it is. Matches run on a single server and it may be down " +
                            "for maintenance, for a release, or for a fault. No uptime is promised and no " +
                            "match result is guaranteed to survive a server restart.",
                    ],
                },
                {
                    heading: "Warranty and liability",
                    body: [
                        "The game is provided without warranty of any kind, express or implied, including " +
                            "warranties of merchantability and fitness for a particular purpose.",
                        "To the extent the law allows, no liability is accepted for indirect or " +
                            "consequential loss arising from using the game or this site. Nothing here " +
                            "limits liability that cannot be limited by law.",
                    ],
                },
                {
                    heading: "Contact",
                    body: [`Questions about these terms go to ${CONTACT}.`],
                },
            ]}
        />
    );
}
