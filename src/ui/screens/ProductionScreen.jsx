// Build — the arsenal, in the dock's drawer. A tab per category over a grid of
// build tiles; the eight tiles the hotbar reaches carry their key. Picking a
// unit arms placement on the map, a warhead queues straight onto the line, and
// the line itself sits at the foot with what is building and what is behind it.
// Presentation only — every mutation goes through the engine api.
import {useState} from "react";
import {DrawerScreen, DrawerTabs} from "./ScreenFrame.jsx";
import UnitIcon from "../common/UnitIcon.jsx";
import Icon from "../common/Icon.jsx";
import Points from "../common/Points.jsx";
import Meter from "../common/Meter.jsx";
import {
    armamentOf,
    gdpOf,
    HANGAR_SPEC,
    incomeOf,
    industryCapOf,
    industryCountOf,
    industryPendingOf,
    launchersForAmmo,
    UNIT_ICON,
    unitLabel,
    unitLockReason,
    UNITS,
    upkeepOf,
    WARHEAD_ORDER,
    WARHEADS,
} from "../../game/engine.js";
import {FALLOUT, INTERCEPT_CAP, WARHEAD_ICON} from "../../game/data/constants.js";
import {fmtGdp, fmtKm, fmtNet} from "../lib/format.js";
import {prodEta, prodGroups, prodIcon, prodLabel, prodSite, prodTime, PROD_CATEGORIES} from "../lib/prod.js";
import {hotbarKeyOf} from "../lib/hotbar.js";
import {cn} from "../lib/cn.js";
import {miniButton} from "../lib/variants.js";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const TABS = [...PROD_CATEGORIES.map((id) => ({id, label: id})), {id: "Munitions", label: "Munitions"}];

// One readout in the strip under the tabs: a mono figure over its name.
function Readout({label, value, tone}) {
    return (
        <div className="flex flex-col gap-[3px] min-w-0 px-3 py-2 border-r border-line last:border-r-0">
            <b className={cn("font-mono tabular-nums text-[12.5px] font-semibold leading-none truncate", tone)}>
                {value}
            </b>
            <span className="text-[10px] leading-none text-faint truncate">{label}</span>
        </div>
    );
}

export default function ProductionScreen({world, api, mySlot, placing, setPlacing, onClose}) {
    const me = world.nations.find((n) => n.slot === mySlot);
    const points = me?.points ?? 0;
    const income = incomeOf(world, mySlot),
        upkeep = upkeepOf(world, mySlot),
        net = income - upkeep;
    const industryCount = industryCountOf(world, mySlot),
        industryCap = industryCapOf(world, mySlot);
    const industryUsed = industryCount + industryPendingOf(world, mySlot);
    const ammo = me?.ammo || {};
    const cur = me?.prod?.current || null;
    const queue = me?.prod?.queue || [];
    const mine = world.units.filter((u) => u.slot === mySlot);
    const queuedOf = (kind, type) =>
        (cur?.item.kind === kind && cur?.item.type === type ? 1 : 0) +
        queue.filter((it) => it.kind === kind && it.type === type).length;

    const [tab, setTab] = useState(PROD_CATEGORIES[0]);

    // Picking a unit arms placement and drops back to the map; clicking the
    // armed unit again disarms it without closing the drawer.
    const pick = (key) => setPlacing(placing === key ? null : key);

    const groups = prodGroups();
    const label = (it) => prodLabel(it, me?.iso);

    // The full stat sheet a tile carries in its tooltip — the tile itself shows
    // the icon, the name and the two figures a decision is made on.
    const statsFor = (u) => {
        const rows = [];
        if (u.kind === "defense") {
            rows.push(`Intercept ${Math.round(Math.min(INTERCEPT_CAP, u.intercept) * 100)}%`);
            rows.push(`Engage range ${fmtKm(u.range)}`);
            if (u.minRange) rows.push(`Min range ${fmtKm(u.minRange)}`);
            rows.push(`Reload ${u.reload.toFixed(1)}s`);
            rows.push(`Shot cost ${u.fireCost}`);
        } else if (u.kind === "offense") {
            rows.push(`Damage ${Math.round(u.damage)}`);
            rows.push(`Strike range ${fmtKm(u.range)}`);
            rows.push(`Reload ${u.reload.toFixed(1)}s`);
            if (u.speed) rows.push(`Missile speed ${u.speed} km/s`);
        } else if (u.detect) {
            rows.push(`Detection ${fmtKm(u.radarKm || u.range)}`);
            rows.push(u.warnOnly ? "Warning only" : "Fire control");
        } else if (u.kind === "industry") {
            rows.push(`Output +${u.output}/s`);
            rows.push(`GDP +$${u.gdpAdd}T`);
        }
        if (u.navalSpeed) rows.push(`Speed ${u.navalSpeed} kn`);
        if (u.airSpeed) rows.push(`Air speed ${u.airSpeed} kn`);
        return rows;
    };

    const unitTile = (key, u) => {
        // null when buildable, else a short reason (locked by tech, prereq or
        // cap). A locked tile drops to 40% and reads its requirement where the
        // cost sits; it cannot arm placement.
        const lock = unitLockReason(world, mySlot, key);
        const afford = points >= u.cost && (net >= 0 || u.kind === "industry");
        const qn = queuedOf("unit", key);
        const spec = HANGAR_SPEC[key];
        const wing = spec ? Object.values(spec).reduce((a, b) => a + b, 0) : 0;
        const arm = armamentOf(key, me?.iso);
        // The key the command deck binds this type to, so the tile states the
        // shortcut that places it without leaving the map.
        const slotKey = hotbarKeyOf(key);
        const line = u.wing
            ? `Air wing of ${wing} aircraft`
            : arm
              ? `Fires ${arm}`
              : u.kind === "industry"
                ? `+${u.output}/s income, +$${u.gdpAdd}T GDP`
                : `${cap(u.kind)}${u.range ? `, ${fmtKm(u.range)}` : ""}`;
        return (
            <button
                key={key}
                className={cn("db-tile", placing === key && "sel", lock && "locked", !lock && !afford && "opacity-60")}
                onClick={() => !lock && pick(key)}
                disabled={!!lock}
                aria-label={lock ? `${unitLabel(key, me?.iso)}, locked: ${lock}` : `${unitLabel(key, me?.iso)}`}
                title={[lock || line, u.desc, ...statsFor(u), `Upkeep ${u.upkeep}/s`].filter(Boolean).join(" · ")}
            >
                {slotKey && !lock && <span className="db-kbd absolute right-[6px] top-[6px]">{slotKey}</span>}
                <UnitIcon name={UNIT_ICON[key]} size={26} className={placing === key ? "text-text" : "text-dim"} />
                <b className="font-semibold text-[12.5px] leading-[1.2]">{unitLabel(key, me?.iso)}</b>
                {lock ? (
                    <span className="font-mono text-[11px] leading-[1.3] text-faint">{lock}</span>
                ) : (
                    <span className="flex items-center justify-between gap-1 font-mono text-[11px] font-medium text-faint">
                        <Points value={u.cost} size={10} />
                        <span>{u.buildTime}s</span>
                    </span>
                )}
                {qn > 0 && !lock && <span className="mt-auto font-mono text-[10px] text-dim">{qn} on the line</span>}
            </button>
        );
    };

    const ammoTile = (key) => {
        const wh = WARHEADS[key];
        const stock = ammo[key] || 0;
        const afford = points >= wh.prodCost;
        const qn = queuedOf("ammo", key);
        const fallout = FALLOUT.warheads.includes(key);
        const users = launchersForAmmo(key); // launcher types cleared to fire this warhead
        return (
            <button
                key={key}
                className={cn("db-tile", !afford && "opacity-60")}
                onClick={(e) => {
                    for (let i = 0, n = e.shiftKey ? 5 : 1; i < n; i++) if (api.produceAmmo(key)?.error) break;
                }}
                aria-label={`${wh.name}, ${wh.prodCost} points, ${stock} in stock. Shift-click to queue five.`}
                title={[
                    wh.desc,
                    users.length ? `Fires from ${users.map((t) => unitLabel(t, me?.iso)).join(", ")}` : null,
                    fallout ? "Contaminates ground zero with radioactive fallout" : null,
                    "Shift-click to queue five",
                ]
                    .filter(Boolean)
                    .join(" · ")}
            >
                <UnitIcon name={WARHEAD_ICON[key]} size={26} className="text-dim" />
                <b className="font-semibold text-[12.5px] leading-[1.2]">{wh.name}</b>
                <span className="flex items-center justify-between gap-1 font-mono text-[11px] font-medium text-faint">
                    <Points value={wh.prodCost} size={10} />
                    <span>{wh.prodTime}s</span>
                </span>
                <span className="mt-auto font-mono text-[10px] text-dim">
                    {stock} in stock{qn > 0 ? ` · ${qn} on the line` : ""}
                </span>
            </button>
        );
    };

    const queueCount = (cur ? 1 : 0) + queue.length;
    const site = cur ? prodSite(cur.item, world, mySlot) : null;

    return (
        <DrawerScreen
            title="Build"
            labelledBy="db-drawer-build"
            caption={
                <>
                    <Points value={Math.floor(points)} size={10} className="text-text" /> · Industry{" "}
                    <b>
                        {industryUsed} / {industryCap}
                    </b>
                </>
            }
            onClose={onClose}
            tabs={<DrawerTabs items={TABS} value={tab} onChange={setTab} label="Arsenal categories" />}
            foot={
                <div className="db-scroll max-h-[172px] overflow-y-auto px-4 pt-3 pb-[14px]">
                    <h4 className="db-sec m-0 mb-2">Queue{queueCount > 0 ? ` · ${queueCount}` : ""}</h4>
                    {queueCount === 0 && (
                        <p className="m-0 text-[11.5px] leading-[1.4] text-faint">
                            The line sits idle. Pick a system to put it to work.
                        </p>
                    )}
                    {cur && (
                        <button
                            className="flex items-center gap-[10px] w-full text-left"
                            onClick={() => api.cancelProd(-1)}
                            title="Building. Click to cancel for a refund"
                        >
                            <UnitIcon name={prodIcon(cur.item)} size={16} className="text-text" />
                            <b className="font-semibold text-[12.5px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                {label(cur.item)}
                            </b>
                            <Meter
                                frac={cur.progress}
                                className="flex-1 min-w-[40px]"
                                ariaLabel={`${label(cur.item)} progress`}
                            />
                            <span className="font-mono text-[11.5px] font-medium text-dim whitespace-nowrap">
                                {prodEta(cur)}s{site ? ` · ${site}` : ""}
                            </span>
                        </button>
                    )}
                    {queue.map((it, i) => (
                        <button
                            key={i}
                            className="group flex items-center gap-[10px] w-full mt-2 text-left"
                            onClick={() => api.cancelProd(i)}
                            title={`${label(it)}, ${prodTime(it)}s. Click to cancel`}
                        >
                            <span className="w-4 font-mono text-[10px] text-faint">{i + 2}</span>
                            <UnitIcon name={prodIcon(it)} size={16} className="text-dim" />
                            <span className="flex-1 min-w-0 text-[12px] text-dim whitespace-nowrap overflow-hidden text-ellipsis">
                                {label(it)}
                            </span>
                            <span className="font-mono text-[11.5px] text-faint whitespace-nowrap">
                                {prodTime(it)}s
                            </span>
                            <Icon name="close" size={11} className="text-faint group-hover:text-danger" />
                        </button>
                    ))}
                </div>
            }
        >
            <div className="grid grid-cols-4 border-b border-line">
                <Readout label="Income" value={`+${income.toFixed(1)}`} />
                <Readout label="Upkeep" value={upkeep > 0 ? `−${upkeep.toFixed(1)}` : upkeep.toFixed(1)} />
                <Readout label="GDP" value={fmtGdp(gdpOf(world, mySlot), 1)} />
                <Readout label="Fielded" value={mine.length} />
            </div>
            {net < 0 && (
                <p className="m-0 mx-3 mt-3 px-3 py-2 text-[11.5px] leading-[1.4] text-text border-l-[3px] border-danger bg-[rgba(224,87,79,0.08)]">
                    In deficit at {fmtNet(net, 1)}/s. Build industry or scrap units to recover.
                </p>
            )}
            {placing && (
                <div className="mx-3 mt-3 px-3 py-2 text-[11.5px] leading-[1.4] text-text border-l-[3px] border-accent bg-accent-soft">
                    Placing <b className="font-semibold">{unitLabel(placing, me?.iso)}</b>. Click{" "}
                    {UNITS[placing].coastal
                        ? "your coastline"
                        : UNITS[placing].domain === "sea"
                          ? "your coastal waters"
                          : "your territory"}{" "}
                    to site it, and hold Shift to place several.
                    <button className={cn(miniButton(), "ml-2 align-middle")} onClick={() => setPlacing(null)}>
                        Cancel
                    </button>
                </div>
            )}
            <div className="grid grid-cols-3 gap-2 p-3 items-start">
                {tab === "Munitions"
                    ? WARHEAD_ORDER.map(ammoTile)
                    : (groups[tab] || []).map(([k, u]) => unitTile(k, u))}
            </div>
        </DrawerScreen>
    );
}
