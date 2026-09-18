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
