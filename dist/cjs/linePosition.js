"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linePosition = linePosition;
/**
 * Canvas coordinate of a line's centre at `units` grid units.
 *
 * Snaps the grid position to a whole pixel first and adds the half line width
 * afterwards. Adding `offset` before rounding would swallow it again: the line
 * centre lands on a pixel boundary, an odd-width line smears across two pixels,
 * and the first line sticks out of the canvas by half its width.
 */
function linePosition(units, gridSize, offset) {
    return Math.floor(units * gridSize) + offset;
}
//# sourceMappingURL=linePosition.js.map