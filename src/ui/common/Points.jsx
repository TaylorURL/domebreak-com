import Icon from "./Icon.jsx";
import {cn} from "../lib/cn.js";

// The command-points currency mark followed by an amount — the single place that
// decides how a points figure reads across the arsenal cards and unit sheets.
// Mono with tabular figures, so a column of costs lines up digit for digit and
// a ticking total never shuffles the mark beside it.
export default function Points({value, size = 11, className}) {
    return (
        <span className={cn("inline-flex items-center gap-1 font-mono tabular-nums", className)}>
            <Icon name="points" size={size} className="flex-none" />
            {value}
        </span>
    );
}
