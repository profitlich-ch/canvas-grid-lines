export type GridType = 'baseline' | 'squared' | 'columns' | 'rows';
export type Units = 'layoutpixel' | 'devicepixel';
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
    extend?: boolean;
}
export interface InitGridOptions extends GridOptions {
    targets: string | HTMLElement | NodeListOf<HTMLElement>;
}
export declare function isGridType(value: string | null | undefined): value is GridType;
export declare function isUnits(value: string | null | undefined): value is Units;
