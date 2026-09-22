import {cn} from "../lib/cn.js";

// Renders a single-path SVG from /public/icons (game-icons.net) as a CSS mask so
// it can be tinted to any color — the mask reads the path alone, so whatever the
// file paints behind its drawing never reaches the screen. Icons are CC BY 3.0
// (Lorc, Delapouite) — attribution lives in README.md.
export default function UnitIcon({name, color = "currentColor", size = 18, className = ""}) {
    const url = `/icons/${name}.svg`;
    return (
        <span
            className={cn(
                "inline-block flex-none [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center] align-middle",
                className,
            )}
            aria-hidden="true"
            style={{
                width: size,
                height: size,
                background: color,
                WebkitMaskImage: `url(${url})`,
                maskImage: `url(${url})`,
            }}
        />
    );
}
