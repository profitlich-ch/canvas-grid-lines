type ColumnsInput = number | string | number[];
interface GridOptions {
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
    gridType?: string;
    color?: string;
    units?: string;
    extend?: boolean;
}
interface InitGridOptions extends GridOptions {
    targets: string | HTMLElement | NodeListOf<HTMLElement>;
}
/**
 * Draws a crisp grid onto an HTML canvas appended to `container`.
 *
 * Each instance owns one container element and one canvas. The canvas is
 * resized and redrawn on window resize, and on demand via the `columns` setter.
 * Containers that are not visible at construction time are observed and
 * initialised lazily once they enter the viewport.
 */
export declare class CanvasGridLines {
    readonly container: HTMLElement;
    /** First value of the parsed `columns` input — the grid resolution. */
    columnsTotal: number;
    /** Raw parsed `columns` array as supplied by the caller. */
    columnsRaw: number[];
    lineWidth: number;
    gridType: string;
    color: string;
    readonly units: string;
    readonly extend: boolean;
    /** Alternating gap pattern for horizontal lines (rows gridType only). */
    private hGaps;
    /** Alternating gap pattern for vertical lines (columns + rows gridType). */
    private vGaps;
    private ratio;
    private gridHeight;
    private gridWidth;
    private canvasHeight;
    private canvasWidth;
    private lineWidthCanvas;
    private canvas;
    private context;
    /** False until the canvas has been created — guards lazy initialisation. */
    private isInitialized;
    private resizeHandler;
    constructor(container: HTMLElement, options?: GridOptions);
    /**
     * Normalises the `columns` input to a positive-integer array.
     * Throws on any non-integer, non-positive or non-parseable value.
     */
    private parseColumns;
    /**
     * Verifies the parsed array has the exact length required by the grid type.
     * Throws otherwise — there is no silent fallback.
     */
    private validateColumns;
    /**
     * Parses, validates and maps the `columns` input to the internal state
     * (`columnsTotal`, `hGaps`, `vGaps`) according to the active grid type.
     */
    private applyColumns;
    /**
     * Creates the canvas, attaches it to the container and triggers the first draw.
     * Idempotent — repeated calls are a no-op once initialised.
     */
    private initialize;
    /**
     * Watches a not-yet-visible container and initialises it the moment it
     * intersects the viewport. The observer disconnects after the first hit.
     */
    private observeForVisibility;
    /**
     * Public setter for live grid updates. Re-parses the value with the same
     * rules as the constructor and redraws if the grid is already initialised.
     */
    set columns(value: ColumnsInput);
    /**
     * Resizes the canvas to match the container's current pixel dimensions
     * (taking devicePixelRatio into account) and triggers a redraw.
     *
     * Called on construction, on window resize, and on every `columns` update.
     * Aborts silently when the container has zero dimensions — this happens
     * when a previously visible container becomes hidden.
     */
    private scale;
    /**
     * Yields line positions (in grid units) following an alternating gap pattern.
     * Starts at 0, then advances by `gaps[0]`, `gaps[1]`, `gaps[0]`, `gaps[1]`, …
     * until `max` is exceeded. Example: `gaps=[2,3]` produces 0, 2, 5, 7, 10, …
     */
    private gapPattern;
    /** Draws a horizontal line at `y`, spanning the full canvas width by default. */
    private horizontalLine;
    /** Draws a vertical line at `x`, spanning the full canvas height by default. */
    private verticalLine;
    /** baseline: one horizontal line per grid unit, full width. */
    private drawBaseline;
    /** squared: baseline pattern plus one vertical line per grid unit. */
    private drawSquared;
    /** columns: vertical lines placed according to the alternating `vGaps` pattern. */
    private drawColumns;
    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    private drawRows;
    /**
     * Renders the grid in a single canvas path, dispatching to the grid-type
     * specific helper. Stroke style and width are applied after the path is built.
     */
    private draw;
}
/**
 * Convenience facade for bulk-managing grids.
 *
 * Use `initGrid` to construct one `CanvasGridLines` per matched element,
 * `setColumns` to update them all at once, and `getGrid` to look one up by
 * its container element.
 */
export declare const canvasGridLines: {
    grids: CanvasGridLines[];
    elementsArray: HTMLElement[];
    /**
     * Creates a `CanvasGridLines` for each element matched by `targets`
     * (CSS selector, single HTMLElement or NodeList) and stores them in `grids`.
     * Per-element configuration via `data-grid-*` attributes wins unless the
     * caller passes an explicit option.
     */
    initGrid(options: InitGridOptions): CanvasGridLines[] | undefined;
    /**
     * Re-applies the given `columns` value to every tracked grid. The value
     * must satisfy each grid's `gridType` constraints — passing e.g. a single
     * number to a mixed set including a `rows`-type grid will throw.
     */
    setColumns(columns: ColumnsInput): void;
    getGrid(element: HTMLElement): CanvasGridLines | undefined;
};
export {};
