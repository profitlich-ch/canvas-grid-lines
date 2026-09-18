/**
 * Canvas coordinate of a line's centre at `units` grid units.
 *
 * Snaps the grid position to a whole pixel first and adds the half line width
 * afterwards. Adding `offset` before rounding would swallow it again: the line
 * centre lands on a pixel boundary, an odd-width line smears across two pixels,
 * and the first line sticks out of the canvas by half its width.
 */
export function linePosition(units: number, gridSize: number, offset: number): number {
    return Math.floor(units * gridSize) + offset;
}

/**
 * How far the canvas sticks out before the container's top/left edge, in
 * device pixels; the rest of `lineWidth` sticks out after the bottom/right edge.
 *
 * A whole number, so the canvas stays on the device-pixel grid. Half the line
 * width would centre odd-width lines exactly, but a canvas at half a pixel
 * leaves it to the browser to blur or snap it — and which way it snaps is not
 * specified. Rounding down puts an odd-width line just after its grid
 * position, which also keeps the top line inside the container.
 */
export function leadingOverhang(lineWidth: number): number {
    return Math.floor(lineWidth / 2);
}
