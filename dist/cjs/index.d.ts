import { type ColumnsInput, type GridOptions, type GridType, type InitGridOptions, type Termination, type Units } from './types';
export type { GridOptions, GridType, InitGridOptions, Termination, Units, ColumnsInput };
/**
 * Draws a crisp grid onto an HTML canvas appended to `container`.
 *
 * Each instance owns one container element and one canvas. The canvas is
 * resized and redrawn on window resize, and on demand via the setters for
 * `columns`, `gridType`, `color` and `lineWidth`. Containers that are not
 * visible at construction time are observed and initialised lazily once they
 * enter the viewport.
 */
export declare class CanvasGridLines {
    readonly container: HTMLElement;
    /** First value of the parsed `columns` input — the grid resolution. */
    columnsTotal: number;
    /** Raw parsed `columns` array as supplied by the caller. */
    columnsRaw: number[];
    readonly units: Units;
    readonly termination: Termination;
    private _gridType;
    private _color;
    private _lineWidth;
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
    /** Pure-helper wrapper that copies the result into the instance fields. */
    private applyColumnsInput;
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
    get gridType(): GridType;
    /**
     * Switches the grid type live. Re-derives the per-axis gap patterns from
     * the existing `columns` value — will throw if the current `columns`
     * length does not fit the new grid type (set a compatible `columns` first).
     */
    set gridType(value: GridType);
    get color(): string;
    /** Updates the stroke colour and redraws (no layout change). */
    set color(value: string);
    get lineWidth(): number;
    /** Updates the line width; rescales because edge margins depend on it. */
    set lineWidth(value: number);
    get columns(): number[];
    /** Updates the grid columns / gap pattern and redraws. */
    set columns(value: ColumnsInput);
    /**
     * Resizes the canvas to match the container's current pixel dimensions
     * (taking devicePixelRatio into account) and triggers a redraw.
     *
     * Aborts silently when the container has zero dimensions — this happens
     * when a previously visible container becomes hidden.
     */
    private scale;
    /** Clears the canvas and re-runs the draw cycle. Cheaper than `scale()`. */
    private redraw;
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
    /**
     * Creates a `CanvasGridLines` for each element matched by `targets`
     * (CSS selector, single HTMLElement or NodeList) and stores them in `grids`.
     * Per-element configuration via `data-grid-*` attributes wins unless the
     * caller passes an explicit option. Always returns an array (possibly empty).
     */
    initGrid(options: InitGridOptions): CanvasGridLines[];
    /**
     * Re-applies the given `columns` value to every tracked grid. The value
     * must satisfy each grid's `gridType` constraints — passing e.g. a single
     * number to a mixed set including a `rows`-type grid will throw.
     */
    setColumns(columns: ColumnsInput): void;
    getGrid(element: HTMLElement): CanvasGridLines | undefined;
};
