/**
 * Yields line positions (in grid units) following an alternating gap pattern.
 * Starts at 0, then advances by `gaps[0]`, `gaps[1]`, `gaps[0]`, `gaps[1]`, …
 * until `max` is exceeded. Example: `gaps=[2,3]` produces 0, 2, 5, 7, 10, …
 */
export declare function gapPattern(max: number, gaps: [number, number]): Generator<number>;
/**
 * Returns the smallest pattern tickmark `>= threshold` produced by an
 * alternating gap sequence starting at 0. Used to round up grid heights
 * to the next horizontal-line position for `termination: 'extend'` on
 * grids that draw horizontal lines only at gap-pattern positions.
 * Example: `nextGapTick(18, [6, 1])` returns 20 (sequence is 0,6,7,13,14,20,…).
 */
export declare function nextGapTick(threshold: number, gaps: [number, number]): number;
