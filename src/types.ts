export type GridType = 'baseline' | 'squared' | 'columns' | 'ribbons' | 'rows';

export type Units = 'layoutpixel' | 'devicepixel';

export type Termination = 'shorten' | 'fill' | 'extend';

export type ColumnsInput = number | string | number[];

export interface GridOptions {
    /**
     * Grid configuration. Number of values depends on `gridType`:
     * - `baseline` / `squared`: 1 value — total grid columns
     * - `columns`: 3 values — `total, gap1, gap2` (alternating vertical line gaps)
     * - `ribbons`: 3 values — `total, band, gap`; same edge sequence as `columns`,
     *   but the space between each edge pair is filled instead of outlined
     * - `rows`: 5 values — `total, v_gap1, v_gap2, h_gap1, h_gap2`
     *   (vertical-line gaps first, horizontal-line gaps second)
     *
     * Accepts a number, comma-separated string ("20,2,3") or number array ([20, 2, 3]).
     */
    columns?: ColumnsInput;
    /** Stroke width. Ignored by filled grid types (`ribbons`), which have no outline. */
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
     * `'extend'` has no effect for grid types without a horizontal edge line
     * (`columns`, `ribbons`), and those ignore `'shorten'` / `'fill'` too — their
     * marks span the full canvas height either way.
     */
    termination?: Termination;
    /**
     * Redraw whenever the container's size changes, not only on window resize.
     * Use it when the container grows or shrinks with its content — images
     * loading, filters, animations. Off by default: every size change
     * reallocates the canvas bitmap, which costs on tall containers.
     *
     * Redraws are batched to at most one per grid per frame and skipped when
     * the container's pixel size did not change. With `termination: 'extend'`
     * the grid pins the container's `min-height`, so it follows growth but not
     * shrinking; call `refresh()` for that.
     */
    observeResize?: boolean;
}

export interface InitGridOptions extends GridOptions {
    targets: string | HTMLElement | NodeListOf<HTMLElement>;
}

const GRID_TYPES: readonly GridType[] = ['baseline', 'squared', 'columns', 'ribbons', 'rows'];
const UNITS: readonly Units[] = ['layoutpixel', 'devicepixel'];
const TERMINATIONS: readonly Termination[] = ['shorten', 'fill', 'extend'];

export function isGridType(value: string | null | undefined): value is GridType {
    return value != null && (GRID_TYPES as readonly string[]).includes(value);
}

export function isUnits(value: string | null | undefined): value is Units {
    return value != null && (UNITS as readonly string[]).includes(value);
}

export function isTermination(value: string | null | undefined): value is Termination {
    return value != null && (TERMINATIONS as readonly string[]).includes(value);
}

/**
 * Reads a boolean `data-*` attribute. A missing attribute yields `undefined`,
 * so the caller's default applies; `"false"` yields `false`; any other value,
 * including the bare attribute (`""`), yields `true`.
 */
export function parseBooleanAttribute(value: string | null): boolean | undefined {
    if (value === null) return undefined;
    return value.trim().toLowerCase() !== 'false';
}
