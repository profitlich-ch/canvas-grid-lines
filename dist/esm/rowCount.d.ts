/**
 * The container height in grid units, snapped to the nearest whole row when
 * it lies within `tolerance` of one.
 *
 * A container sized in whole grid units rarely measures as exactly that: its
 * height and the grid unit both come out of fractional CSS values, and the
 * layout rounds them independently. Without snapping, 31.99 rows lose the
 * bottom line when rounded down, and 32.01 rows gain a whole row when
 * `extend` rounds up.
 *
 * @param height Container height in device pixels.
 * @param gridSize Grid unit in device pixels.
 * @param tolerance Largest deviation from a whole row that still counts as
 *   that row, in device pixels.
 */
export declare function snappedRows(height: number, gridSize: number, tolerance: number): number;
