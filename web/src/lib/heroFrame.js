// Where the hero's framed board sits, measured once for the two things that have
// to agree on it: the hairline Hero.jsx draws over the open half of the board,
// and the camera HeroDefenseScene aims into it. The scene's country names are
// projected by the map rather than laid out by the page, so the only way they
// stay inside that hairline — rather than straddling it or sliding under the
// caption beneath it — is for the camera to aim at the same box the frame is
// drawn around, at every window size.
//
// The frame starts where the ground held under the copy has finished fading:
// the 36rem column and its 2rem gutter inside a container that stops growing at
// 1400px, then the 12rem Hero.jsx fades that ground out over. It holds 2rem off
// the right edge and 17% down the hero, and is at most 620px across and 470 tall
// for every 620 across. Below xl the column leaves too little room past the
// fade for a frame worth drawing, so Hero.jsx draws it from there up; the
// camera aims at the same box either way.
const COLUMN_END = 608;
const CONTAINER = 1400;
const FADE = 192;
const INSET = 32;
const TOP_PERCENT = 17;
const WIDTH = 620;
const HEIGHT = 470;

// The frame as CSS, for the element itself. Percentages resolve against the
// hero, which the frame is positioned in and the scene fills.
export const FRAME_STYLE = {
    left: `max(${COLUMN_END}px + max(0px, (100% - ${CONTAINER}px) / 2) + ${FADE}px, 100% - ${INSET + WIDTH}px)`,
    right: `${INSET}px`,
    top: `${TOP_PERCENT}%`,
};

// The box the hairline is drawn around, which keeps its proportions as the
// frame narrows.
export const FRAME_BOX_STYLE = {aspectRatio: `${WIDTH} / ${HEIGHT}`};

// The same box in pixels, for a hero `width` by `height`.
export function frameBox(width, height) {
    const left = Math.max(COLUMN_END + Math.max(0, (width - CONTAINER) / 2) + FADE, width - INSET - WIDTH);
    const right = width - INSET;
    const top = (height * TOP_PERCENT) / 100;
    return {left, top, right, bottom: top + ((right - left) * HEIGHT) / WIDTH};
}
