import { type ColumnsInput, type GridOptions, type GridType, type InitGridOptions, type Termination, type Units } from './types';
export type { GridOptions, GridType, InitGridOptions, Termination, Units, ColumnsInput };
/**
 * Draws a crisp grid onto an HTML canvas appended to `container`.
 *
 * Each instance owns one container element and one canvas. The canvas is
 * resized and redrawn on window resize, on container resize when
 * `observeResize` is set, on `refresh()`, and via the setters for `columns`,
 * `gridType`, `color` and `lineWidth`. Containers that are not visible at
 * construction time are observed and initialised lazily once they enter the
 * viewport.
 */
export declare class CanvasGridLines {
    /**
     * One observer for all grids with `observeResize`, created on first use.
     * A page often carries dozens of grids; one observer per grid would buy
     * nothing but bookkeeping.
     */
    private static resizeObserver;
    private static observedGrids;
    /**
     * Redraws on the next frame, not inside the observer callback: `scale()`
     * changes `min-height` under `termination: 'extend'`, and a size change
     * inside the callback makes browsers report a "ResizeObserver loop" error.
     */
    private static queueResized;
    readonly container: HTMLElement;
    /** First value of the parsed `columns` input — the grid resolution. */
    columnsTotal: number;
    /** Raw parsed `columns` array as supplied by the caller. */
    columnsRaw: number[];
    readonly units: Units;
    readonly termination: Termination;
    readonly observeResize: boolean;
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
    /** Container size at the last `scale()`, recorded only with `observeResize`. */
    private scaledWidth;
    private scaledHeight;
    constructor(container: HTMLElement, options?: GridOptions);
    /** Pure-helper wrapper that copies the result into the instance fields. */
    private applyColumnsInput;
    /**
     * Creates the canvas, attaches it to the container and triggers the first draw.
     * Idempotent — repeated calls are a no-op once initialised.
     */
    private initialize;
    /** Registers the container with the shared observer. No-op where ResizeObserver is missing. */
    private observeContainerResize;
    /**
     * Rescales only if the container's pixel size changed since the last
     * `scale()`. `scale()` measures `offsetWidth`/`offsetHeight`, which are
     * whole pixels, so a smaller change would produce the identical canvas.
     * This also swallows the notification that `observe()` fires on its own,
     * and the one caused by `extend` growing the container.
     */
    private refreshIfResized;
    /**
     * Re-measures the container and redraws the grid. Call it after anything
     * that changes the container's size without resizing the window — content
     * loading, a layout switch, the end of an animation — or use
     * `observeResize` to have it happen automatically.
     *
     * Before the container has become visible this does nothing; the lazy
     * initialisation measures on its own.
     */
    refresh(): void;
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
    /**
     * Remembers the size the canvas was built for, after `extend` has applied
     * its `min-height`. Skipped without `observeResize`: the read forces a
     * layout that nobody else needs.
     */
    private recordScaledSize;
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
     * ribbons: the spans between the `vGaps` edge pairs as filled bands over the
     * full canvas height. Same edge sequence as `drawColumns`, closed into
     * rectangles instead of stroked.
     *
     * Both edges are floored, so a band starts exactly where its neighbour's gap
     * ended — rounding each edge independently would leave seams or overlaps.
     */
    private drawRibbons;
    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    private drawRows;
    /**
     * Renders the grid in a single canvas path, dispatching to the grid-type
     * specific helper. Paint style is applied after the path is built: filled
     * types close their subpaths with `rect()` and get one `fill()`, all others
     * one `stroke()`. No type mixes the two, so a single path suffices.
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
