import {
    type ColumnsInput,
    type GridOptions,
    type GridType,
    type InitGridOptions,
    type Termination,
    type Units,
    isGridType,
    isTermination,
    isUnits,
    parseBooleanAttribute,
} from './types';
import {
    DEFAULT_COLOR,
    DEFAULT_COLUMNS,
    DEFAULT_GRID_TYPE,
    DEFAULT_LINE_WIDTH,
    DEFAULT_OBSERVE_RESIZE,
    DEFAULT_TERMINATION,
    DEFAULT_UNITS,
    INIT_MARKER_ATTR,
    ROW_SNAP_TOLERANCE,
} from './constants';
import { createFrameBatch } from './frameBatch';
import { GRID_TYPE_CONFIG } from './gridTypeConfig';
import { applyColumns } from './parseColumns';
import { bandSpans, gapPattern, nextGapTick } from './gapPattern';
import { leadingOverhang, linePosition } from './linePosition';
import { snappedRows } from './rowCount';

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
export class CanvasGridLines {
    /**
     * One observer for all grids with `observeResize`, created on first use.
     * A page often carries dozens of grids; one observer per grid would buy
     * nothing but bookkeeping.
     */
    private static resizeObserver: ResizeObserver | null = null;
    private static observedGrids = new Map<Element, CanvasGridLines>();
    /**
     * Redraws on the next frame, not inside the observer callback: `scale()`
     * changes `min-height` under `termination: 'extend'`, and a size change
     * inside the callback makes browsers report a "ResizeObserver loop" error.
     */
    private static queueResized = createFrameBatch<CanvasGridLines>(
        callback => window.requestAnimationFrame(callback),
        grid => grid.refreshIfResized(),
    );

    public readonly container: HTMLElement;

    /** First value of the parsed `columns` input — the grid resolution. */
    public columnsTotal!: number;
    /** Raw parsed `columns` array as supplied by the caller. */
    public columnsRaw!: number[];

    public readonly units: Units;
    public readonly termination: Termination;
    public readonly observeResize: boolean;

    private _gridType!: GridType;
    private _color: string;
    private _lineWidth: number;

    /** Alternating gap pattern for horizontal lines (rows gridType only). */
    private hGaps: [number, number] | null = null;
    /** Alternating gap pattern for vertical lines (columns + rows gridType). */
    private vGaps: [number, number] | null = null;

    private ratio: number = 0;
    private gridHeight: number = 0;
    private gridWidth: number = 0;
    private canvasHeight: number = 0;
    private canvasWidth: number = 0;
    private lineWidthCanvas: number = 0;
    /** Canvas overhang before the container's left edge, in device pixels. */
    private overhangLeft: number = 0;
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    /** False until the canvas has been created — guards lazy initialisation. */
    private isInitialized: boolean = false;
    private resizeHandler: () => void = () => this.scale();
    /** Container size at the last `scale()`, recorded only with `observeResize`. */
    private scaledWidth: number = -1;
    private scaledHeight: number = -1;

    constructor(
        container: HTMLElement,
        options: GridOptions = {}
    ) {
        this.container = container;

        // gridType — explicit option wins, then HTML data attribute, then default. Validated.
        const gridTypeRaw = options.gridType ?? container.getAttribute('data-grid-type') ?? DEFAULT_GRID_TYPE;
        if (!isGridType(gridTypeRaw)) {
            throw new Error(`Invalid gridType "${gridTypeRaw}"`);
        }
        this._gridType = gridTypeRaw;

        // units — same resolution chain, validated.
        const unitsRaw = options.units ?? container.getAttribute('data-grid-units') ?? DEFAULT_UNITS;
        if (!isUnits(unitsRaw)) {
            throw new Error(`Invalid units "${unitsRaw}"`);
        }
        this.units = unitsRaw;

        this._color = options.color ?? container.getAttribute('data-grid-color') ?? DEFAULT_COLOR;

        const lineWidthAttr = container.getAttribute('data-grid-line');
        this._lineWidth = options.lineWidth ?? (lineWidthAttr !== null ? parseInt(lineWidthAttr, 10) : DEFAULT_LINE_WIDTH);

        const terminationRaw = options.termination
            ?? container.getAttribute('data-grid-termination')
            ?? DEFAULT_TERMINATION;
        if (!isTermination(terminationRaw)) {
            throw new Error(`Invalid termination "${terminationRaw}"`);
        }
        this.termination = terminationRaw;

        this.observeResize = options.observeResize
            ?? parseBooleanAttribute(container.getAttribute('data-grid-observe-resize'))
            ?? DEFAULT_OBSERVE_RESIZE;

        const rawColumns: ColumnsInput = options.columns
            ?? container.getAttribute('data-grid-columns')
            ?? DEFAULT_COLUMNS;
        this.applyColumnsInput(rawColumns);

        // Initialise immediately if visible, otherwise defer until the container enters the viewport.
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            this.initialize();
        } else {
            this.observeForVisibility();
        }
    }

    /** Pure-helper wrapper that copies the result into the instance fields. */
    private applyColumnsInput(raw: ColumnsInput): void {
        const result = applyColumns(raw, this._gridType);
        this.columnsTotal = result.columnsTotal;
        this.columnsRaw = result.columnsRaw;
        this.hGaps = result.hGaps;
        this.vGaps = result.vGaps;
    }

    /**
     * Creates the canvas, attaches it to the container and triggers the first draw.
     * Idempotent — repeated calls are a no-op once initialised.
     */
    private initialize() {
        if (this.isInitialized) return;

        // The canvas is absolutely positioned over the container; the container
        // must therefore establish a positioning context.
        if (window.getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.container.setAttribute(INIT_MARKER_ATTR, 'true');
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.isInitialized = true;
        this.scale();
        // Kept alongside the observer: a devicePixelRatio change (browser zoom,
        // moving to another screen) fires `resize` but leaves the CSS size alone.
        window.addEventListener('resize', this.resizeHandler);
        if (this.observeResize) this.observeContainerResize();
    }

    /** Registers the container with the shared observer. No-op where ResizeObserver is missing. */
    private observeContainerResize() {
        if (typeof ResizeObserver === 'undefined') return;

        CanvasGridLines.resizeObserver ??= new ResizeObserver(entries => {
            for (const entry of entries) {
                const grid = CanvasGridLines.observedGrids.get(entry.target);
                if (grid) CanvasGridLines.queueResized(grid);
            }
        });
        CanvasGridLines.observedGrids.set(this.container, this);
        CanvasGridLines.resizeObserver.observe(this.container);
    }

    /**
     * Rescales only if the container's pixel size changed since the last
     * `scale()`. `scale()` measures `offsetWidth`/`offsetHeight`, which are
     * whole pixels, so a smaller change would produce the identical canvas.
     * This also swallows the notification that `observe()` fires on its own,
     * and the one caused by `extend` growing the container.
     */
    private refreshIfResized() {
        if (this.container.offsetWidth === this.scaledWidth
            && this.container.offsetHeight === this.scaledHeight) {
            return;
        }
        this.scale();
    }

    /**
     * Re-measures the container and redraws the grid. Call it after anything
     * that changes the container's size without resizing the window — content
     * loading, a layout switch, the end of an animation — or use
     * `observeResize` to have it happen automatically.
     *
     * Before the container has become visible this does nothing; the lazy
     * initialisation measures on its own.
     */
    public refresh(): void {
        if (this.isInitialized) this.scale();
    }

    /**
     * Watches a not-yet-visible container and initialises it the moment it
     * intersects the viewport. The observer disconnects after the first hit.
     */
    private observeForVisibility() {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.initialize();
                    obs.unobserve(this.container);
                }
            });
        }, { threshold: 0.01 }); // > 0 so a zero-area container does not trigger

        observer.observe(this.container);
    }

    get gridType(): GridType { return this._gridType; }
    /**
     * Switches the grid type live. Re-derives the per-axis gap patterns from
     * the existing `columns` value — will throw if the current `columns`
     * length does not fit the new grid type (set a compatible `columns` first).
     */
    set gridType(value: GridType) {
        if (!isGridType(value)) {
            throw new Error(`Invalid gridType "${value}"`);
        }
        this._gridType = value;
        this.applyColumnsInput(this.columnsRaw);
        if (this.isInitialized) this.scale();
    }

    get color(): string { return this._color; }
    /** Updates the stroke colour and redraws (no layout change). */
    set color(value: string) {
        this._color = value;
        if (this.isInitialized) this.redraw();
    }

    get lineWidth(): number { return this._lineWidth; }
    /** Updates the line width; rescales because edge margins depend on it. */
    set lineWidth(value: number) {
        this._lineWidth = value;
        if (this.isInitialized) this.scale();
    }

    get columns(): number[] { return this.columnsRaw; }
    /** Updates the grid columns / gap pattern and redraws. */
    set columns(value: ColumnsInput) {
        this.applyColumnsInput(value);
        if (this.isInitialized) this.scale();
    }

    /**
     * Resizes the canvas to match the container's current pixel dimensions
     * (taking devicePixelRatio into account) and triggers a redraw.
     *
     * Aborts silently when the container has zero dimensions — this happens
     * when a previously visible container becomes hidden.
     */
    private scale() {
        // SSR guard.
        if (typeof window === 'undefined') return;

        // Reset our inline min-height so we measure the container's natural height
        // (with any user-CSS min-height still applied), then flush layout synchronously.
        this.container.style.minHeight = '';
        void this.container.offsetHeight;

        if (this.container.offsetHeight === 0 || this.container.offsetWidth === 0) {
            this.recordScaledSize();
            return;
        }

        this.ratio = window.devicePixelRatio || 1;

        // `lineWidth` is interpreted as CSS pixels (`layoutpixel`) or as physical
        // canvas pixels (`devicepixel`); the canvas always works in physical pixels.
        this.lineWidthCanvas = this.units === 'layoutpixel' ? this._lineWidth / this.ratio : this._lineWidth;

        // Edge lines stick out of the container — extend the canvas by one line
        // width along axes that carry an edge line. The vertical axis only
        // needs it where the grid type draws horizontal edge lines; vertical
        // lines always reach the side edges.
        const config = GRID_TYPE_CONFIG[this._gridType];
        const marginX: number = this.lineWidthCanvas;
        const marginY: number = config.hasHorizontalEdgeLine ? this.lineWidthCanvas : 0;

        // Fractional size: `offsetWidth`/`offsetHeight` round width and height
        // independently to whole pixels, which can put a container sized in
        // whole grid units a pixel off a row boundary.
        const rect = this.container.getBoundingClientRect();
        this.gridWidth = rect.width * this.ratio;
        const rawHeight = rect.height * this.ratio;

        // `extend` rounds the canvas up so a horizontal line can close the bottom
        // edge — meaningless for grid types that draw none.
        if (this.termination === 'extend' && config.hasHorizontalEdgeLine) {
            // Round up so a horizontal line closes the bottom edge. For `rows`
            // the horizontals only sit on hGaps-pattern positions, so round up
            // to the next pattern tickmark; otherwise to the next integer row.
            const gridSize = this.gridWidth / this.columnsTotal;
            const rawRows = this.snappedRows(rawHeight, gridSize);
            const targetRows = (this._gridType === 'rows' && this.hGaps)
                ? nextGapTick(rawRows, this.hGaps)
                : Math.ceil(rawRows);
            this.gridHeight = targetRows * gridSize;
            // Grow the container itself so its background/border wraps the extension.
            // `min-height` refers to the content area under `content-box` (default),
            // so we subtract padding+border for that case; with `border-box` it refers
            // to the whole box and we set the target directly.
            const cs = window.getComputedStyle(this.container);
            let targetMinHeight = this.gridHeight / this.ratio;
            if (cs.boxSizing !== 'border-box') {
                const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
                const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
                targetMinHeight -= paddingY + borderY;
            }
            this.container.style.minHeight = targetMinHeight + 'px';
        } else {
            this.gridHeight = rawHeight;
        }

        // Whole device pixels: `canvas.width/height` truncate, and a bitmap
        // smaller than its CSS size gets stretched and blurs the lines. The
        // height also leaves room for a bottom line snapped past `gridHeight`.
        const gridSize = this.gridWidth / this.columnsTotal;
        const snappedBottom = Math.floor(Math.floor(this.snappedRows(this.gridHeight, gridSize)) * gridSize);
        this.canvasHeight = Math.ceil(Math.max(this.gridHeight, snappedBottom) + marginY);
        this.canvasWidth = Math.ceil(this.gridWidth + marginX);

        // Physical canvas size (device pixels).
        this.canvas.height = this.canvasHeight;
        this.canvas.width = this.canvasWidth;

        // Negative margins pull the oversized canvas back over the top/left edge by
        // whole device pixels; the rest of the overhang lies past the bottom/right edge.
        this.overhangLeft = leadingOverhang(marginX);
        const overhangTop = leadingOverhang(marginY);
        this.canvas.style.margin = `${-overhangTop / this.ratio}px 0 0 ${-this.overhangLeft / this.ratio}px`;

        // CSS size (layout pixels) — the browser scales the device-pixel canvas back down.
        this.canvas.style.width = this.canvasWidth / this.ratio + 'px';
        this.canvas.style.height = this.canvasHeight / this.ratio + 'px';

        this.recordScaledSize();
        this.redraw();
    }

    /**
     * Remembers the size the canvas was built for, after `extend` has applied
     * its `min-height`. Skipped without `observeResize`: the read forces a
     * layout that nobody else needs.
     */
    private recordScaledSize() {
        if (!this.observeResize) return;
        this.scaledWidth = this.container.offsetWidth;
        this.scaledHeight = this.container.offsetHeight;
    }

    /** Rows in `height` (device pixels), snapped to a whole row within `ROW_SNAP_TOLERANCE`. */
    private snappedRows(height: number, gridSize: number): number {
        return snappedRows(height, gridSize, ROW_SNAP_TOLERANCE * this.ratio);
    }

    /** Clears the canvas and re-runs the draw cycle. Cheaper than `scale()`. */
    private redraw() {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
    }

    /** Draws a horizontal line at `y`, spanning the full canvas width by default. */
    private horizontalLine(y: number, length: number = this.canvasWidth): void {
        this.context.moveTo(0, y);
        this.context.lineTo(length, y);
    }

    /** Draws a vertical line at `x`, spanning the full canvas height by default. */
    private verticalLine(x: number, length: number = this.canvasHeight): void {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, length);
    }

    /** baseline: one horizontal line per grid unit, full width. */
    private drawBaseline(gridSize: number, offset: number): void {
        // Integer counter avoids float-accumulation drift in `y += gridSize`.
        const lastN = Math.floor(this.snappedRows(this.gridHeight, gridSize));
        for (let n = 0; n <= lastN; n++) {
            this.horizontalLine(linePosition(n, gridSize, offset));
        }
    }

    /** squared: baseline pattern plus one vertical line per grid unit. */
    private drawSquared(gridSize: number, offset: number): void {
        this.drawBaseline(gridSize, offset);

        // `fill`: vertical lines run to the canvas edge; otherwise they stop at the
        // lower edge of the last horizontal line (last full grid row).
        const lastN = Math.floor(this.snappedRows(this.gridHeight, gridSize));
        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : Math.floor(lastN * gridSize) + this.lineWidthCanvas;

        for (let col = 0; col <= this.columnsTotal; col++) {
            this.verticalLine(linePosition(col, gridSize, offset), lineLength);
        }
    }

    /** columns: vertical lines placed according to the alternating `vGaps` pattern. */
    private drawColumns(gridSize: number, offset: number): void {
        if (!this.vGaps) return;
        for (const col of gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(linePosition(col, gridSize, offset));
        }
    }

    /**
     * ribbons: the spans between the `vGaps` edge pairs as filled bands over the
     * full canvas height. Same edge sequence as `drawColumns`, closed into
     * rectangles instead of stroked.
     *
     * Both edges are floored, so a band starts exactly where its neighbour's gap
     * ended — rounding each edge independently would leave seams or overlaps.
     * The canvas overhang is added back so the edges land on the grid position
     * in the container, not in the canvas.
     */
    private drawRibbons(gridSize: number): void {
        if (!this.vGaps) return;
        for (const [start, end] of bandSpans(this.columnsTotal, this.vGaps)) {
            const left = Math.floor(start * gridSize) + this.overhangLeft;
            const right = Math.floor(end * gridSize) + this.overhangLeft;
            this.context.rect(left, 0, right - left, this.canvasHeight);
        }
    }

    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    private drawRows(gridSize: number, offset: number): void {
        if (!this.hGaps || !this.vGaps) return;
        const verticalRange = Math.floor(this.snappedRows(this.gridHeight, gridSize));

        // Draw horizontals first, remember where the last one actually lands —
        // the gap pattern usually stops short of `verticalRange`.
        let lastRow = 0;
        for (const row of gapPattern(verticalRange, this.hGaps)) {
            lastRow = row;
            this.horizontalLine(linePosition(row, gridSize, offset));
        }

        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : Math.floor(lastRow * gridSize) + this.lineWidthCanvas;

        for (const col of gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(linePosition(col, gridSize, offset), lineLength);
        }
    }

    /**
     * Renders the grid in a single canvas path, dispatching to the grid-type
     * specific helper. Paint style is applied after the path is built: filled
     * types close their subpaths with `rect()` and get one `fill()`, all others
     * one `stroke()`. No type mixes the two, so a single path suffices.
     */
    private draw() {
        this.context.beginPath();

        const gridSize = this.gridWidth / this.columnsTotal;
        const offset = this.lineWidthCanvas / 2;

        switch (this._gridType) {
            case 'baseline': this.drawBaseline(gridSize, offset); break;
            case 'squared':  this.drawSquared(gridSize, offset); break;
            case 'columns':  this.drawColumns(gridSize, offset); break;
            case 'ribbons':  this.drawRibbons(gridSize); break;
            case 'rows':     this.drawRows(gridSize, offset); break;
            default: {
                // Exhaustiveness check — fails the build if a new GridType is added without a handler.
                const _exhaustive: never = this._gridType;
                throw new Error(`Unhandled gridType: ${String(_exhaustive)}`);
            }
        }

        if (GRID_TYPE_CONFIG[this._gridType].isFilled) {
            this.context.fillStyle = this._color;
            this.context.fill();
            return;
        }

        this.context.strokeStyle = this._color;
        this.context.lineWidth = this.lineWidthCanvas;
        this.context.stroke();
    }
}

/**
 * Convenience facade for bulk-managing grids.
 *
 * Use `initGrid` to construct one `CanvasGridLines` per matched element,
 * `setColumns` to update them all at once, and `getGrid` to look one up by
 * its container element.
 */
export const canvasGridLines = {
    grids: [] as CanvasGridLines[],

    /**
     * Creates a `CanvasGridLines` for each element matched by `targets`
     * (CSS selector, single HTMLElement or NodeList) and stores them in `grids`.
     * Per-element configuration via `data-grid-*` attributes wins unless the
     * caller passes an explicit option. Always returns an array (possibly empty).
     */
    initGrid(options: InitGridOptions): CanvasGridLines[] {
        const { targets, ...gridOptions } = options;

        if (!targets) {
            throw new Error('No selector for elements given');
        }

        const elements: HTMLElement[] = [];
        if (typeof targets === 'string') {
            let elementsNodeList: NodeListOf<HTMLElement>;
            try {
                elementsNodeList = document.querySelectorAll(targets);
            } catch (error) {
                throw new Error(`Invalid selector: ${targets}`);
            }
            elements.push(...Array.from(elementsNodeList));
        } else if (targets instanceof NodeList) {
            elements.push(...Array.from(targets));
        } else {
            elements.push(targets);
        }

        const newGrids = elements.map(element => new CanvasGridLines(element, gridOptions));
        this.grids.push(...newGrids);
        return newGrids;
    },

    /**
     * Re-applies the given `columns` value to every tracked grid. The value
     * must satisfy each grid's `gridType` constraints — passing e.g. a single
     * number to a mixed set including a `rows`-type grid will throw.
     */
    setColumns(columns: ColumnsInput): void {
        this.grids.forEach(grid => {
            grid.columns = columns;
        });
    },

    getGrid(element: HTMLElement): CanvasGridLines | undefined {
        return this.grids.find(grid => grid.container === element);
    },
};
