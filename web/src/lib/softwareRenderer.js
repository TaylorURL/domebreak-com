// A renderer with no GPU behind it names itself: Chrome's SwiftShader, Mesa's
// llvmpipe, a platform's software fallback. Any of them rasterises WebGL on
// the same thread the page is laid out on.
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|softpipe|software|basic render/i;

/**
 * Whether this browser draws WebGL in software.
 *
 * A vector map that a GPU renders for nothing costs, on such a machine, more
 * per frame than the page paints in the same time, so what asks this leaves
 * the map out rather than draw it.
 *
 * @returns {boolean}
 */
export function drawsInSoftware() {
    if (typeof document === "undefined") return false;
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") || probe.getContext("webgl");
    if (!gl) return true;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return SOFTWARE_RENDERER.test(String(renderer || ""));
}
