export type GridType = 'baseline' | 'squared' | 'columns' | 'rows';
export type Units = 'layoutpixel' | 'devicepixel';
export type Termination = 'shorten' | 'fill' | 'extend';
export type ColumnsInput = number | string | number[];
export interface GridOptions {
    /**
     * Grid configuration. Number of values depends on `gridType`:
     * - `baseline` / `squared`: 1 value — total grid columns
     * - `columns`: 3 values — `total, gap1, gap2` (alternating vertical line gaps)
     * - `rows`: 5 values — `total, v_gap1, v_gap2, h_gap1, h_gap2`
     *   (vertical-line gaps first, horizontal-line gaps second)
     *
     * Accepts a number, comma-separated string ("20,2,3") or number array ([20, 2, 3]).
     */
    columns?: ColumnsInput;
    lineWidth?: number;
    gridType?: GridType;
    color?: string;
    units?: Units;
    /**
     * How the grid terminates at the bottom edge:
     * - `'shorten'` (default) — canvas height = parent height + 1 line width;
     *   vertical lines stop at the last horizontal line (the bottom stub stays empty).
     * - `'fill'` — same canvas height as `'shorten'`, but vertical lines run all
     *   the way down to the canvas edge, filling the bottom stub.
     * - `'extend'` — the canvas is extended downward to the next multiple of
     *   `gridWidth / columns` so a horizontal bottom line can close the grid.
     *
     * `'extend'` has no effect for `gridType: 'columns'` (no horizontal lines).
     */
    termination?: Termination;
}
export interface InitGridOptions extends GridOptions {
    targets: string | HTMLElement | NodeListOf<HTMLElement>;
}
export declare function isGridType(value: string | null | undefined): value is GridType;
export declare function isUnits(value: string | null | undefined): value is Units;
export declare function isTermination(value: string | null | undefined): value is Termination;
