"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gapPattern = gapPattern;
/**
 * Yields line positions (in grid units) following an alternating gap pattern.
 * Starts at 0, then advances by `gaps[0]`, `gaps[1]`, `gaps[0]`, `gaps[1]`, …
 * until `max` is exceeded. Example: `gaps=[2,3]` produces 0, 2, 5, 7, 10, …
 */
function* gapPattern(max, gaps) {
    let pos = 0;
    let i = 0;
    while (pos <= max) {
        yield pos;
        pos += gaps[i % 2];
        i++;
    }
}
//# sourceMappingURL=gapPattern.js.map