"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gapPattern = gapPattern;
exports.bandSpans = bandSpans;
exports.nextGapTick = nextGapTick;
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
/**
 * Pairs the alternating gap sequence into band spans `[start, end]` in grid
 * units: every even-indexed edge opens a band, the next edge closes it.
 * `gaps=[2,3]` at max 12 yields [0,2], [5,7], [10,12].
 *
 * A trailing edge without a partner is dropped. `gapPattern` does not guarantee
 * an even number of edges — `gaps=[2,3]` at max 11 ends on an opening edge — and
 * a band that is never closed has no width to fill.
 */
function bandSpans(max, gaps) {
    const edges = Array.from(gapPattern(max, gaps));
    const spans = [];
    for (let i = 0; i + 1 < edges.length; i += 2) {
        spans.push([edges[i], edges[i + 1]]);
    }
    return spans;
}
/**
 * Returns the smallest pattern tickmark `>= threshold` produced by an
 * alternating gap sequence starting at 0. Used to round up grid heights
 * to the next horizontal-line position for `termination: 'extend'` on
 * grids that draw horizontal lines only at gap-pattern positions.
 * Example: `nextGapTick(18, [6, 1])` returns 20 (sequence is 0,6,7,13,14,20,…).
 */
function nextGapTick(threshold, gaps) {
    let pos = 0;
    let i = 0;
    while (pos < threshold) {
        pos += gaps[i % 2];
        i++;
    }
    return pos;
}
//# sourceMappingURL=gapPattern.js.map