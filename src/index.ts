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
} from './types';
import {
    DEFAULT_COLOR,
    DEFAULT_COLUMNS,
    DEFAULT_GRID_TYPE,
    DEFAULT_LINE_WIDTH,
    DEFAULT_TERMINATION,
    DEFAULT_UNITS,
    INIT_MARKER_ATTR,
} from './constants';
import { GRID_TYPE_CONFIG } from './gridTypeConfig';
import { applyColumns } from './parseColumns';
import { gapPattern, nextGapTick } from './gapPattern';

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
export class CanvasGridLines {
    public readonly container: HTMLElement;

    /** First value of the parsed `columns` input — the grid resolution. */
    public columnsTotal!: number;
    /** Raw parsed `columns` array as supplied by the caller. */
    public columnsRaw!: number[];

    public readonly units: Units;
    public readonly termination: Termination;

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
    private canvas!: HTMLCanvasElement;
    private context!: CanvasRenderingContext2D;

    /** False until the canvas has been created — guards lazy initialisation. */
    private isInitialized: boolean = false;
    private resizeHandler: () => void = () => this.scale();

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
        window.addEventListener('resize', this.resizeHandler);
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
            return;
        }

        this.ratio = window.devicePixelRatio || 1;

        // `lineWidth` is interpreted as CSS pixels (`layoutpixel`) or as physical
        // canvas pixels (`devicepixel`); the canvas always works in physical pixels.
        this.lineWidthCanvas = this.units === 'layoutpixel' ? this._lineWidth / this.ratio : this._lineWidth;

        // Edge lines would otherwise be clipped in half — extend the canvas by
        // one line width along axes that carry an edge line. Horizontal-axis
        // edge lines are always added (vertical lines always reach the side edges).
        const config = GRID_TYPE_CONFIG[this._gridType];
        const marginX: number = this.lineWidthCanvas;
        const marginY: number = config.hasHorizontalEdgeLine ? this.lineWidthCanvas : 0;

        this.gridWidth = this.container.offsetWidth * this.ratio;
        const rawHeight = this.container.offsetHeight * this.ratio;

        if (this.termination === 'extend' && this._gridType !== 'columns') {
            // Round up so a horizontal line closes the bottom edge. For `rows`
            // the horizontals only sit on hGaps-pattern positions, so round up
            // to the next pattern tickmark; otherwise to the next integer row.
            const gridSize = this.gridWidth / this.columnsTotal;
            const rawRows = rawHeight / gridSize;
            const targetRows = (this._gridType === 'rows' && this.hGaps)
                ? nextGapTick(rawRows - 1e-9, this.hGaps)
                : Math.ceil(rawRows - 1e-9);
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

        this.canvasHeight = this.gridHeight + marginY;
        this.canvasWidth = this.gridWidth + marginX;

        // Physical canvas size (device pixels).
        this.canvas.height = this.canvasHeight;
        this.canvas.width = this.canvasWidth;

        // Negative margins pull the oversized canvas back so it stays centred on the container.
        this.canvas.style.margin = `${marginY * -0.5 / this.ratio}px ${marginX * -0.5 / this.ratio}px`;

        // CSS size (layout pixels) — the browser scales the device-pixel canvas back down.
        this.canvas.style.width = this.canvasWidth / this.ratio + 'px';
        this.canvas.style.height = this.canvasHeight / this.ratio + 'px';

        this.redraw();
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
        // Integer counter + epsilon: avoids float-accumulation drift in `y += gridSize`
        // and the float wobble that makes `gridHeight / gridSize` land at e.g. 17.999…
        // instead of 18 after `Math.ceil(rawHeight/gridSize) * gridSize` at termination='extend'.
        const lastN = Math.floor(this.gridHeight / gridSize + 1e-9);
        for (let n = 0; n <= lastN; n++) {
            this.horizontalLine(Math.floor(n * gridSize + offset));
        }
    }

    /** squared: baseline pattern plus one vertical line per grid unit. */
    private drawSquared(gridSize: number, offset: number): void {
        this.drawBaseline(gridSize, offset);

        // `fill`: vertical lines run to the canvas edge; otherwise they stop at the
        // last horizontal line (last full grid row). Epsilon matches `drawBaseline`
        // so float drift doesn't drop the bottom row at termination='extend'.
        const lastN = Math.floor(this.gridHeight / gridSize + 1e-9);
        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : lastN * gridSize + offset;

        this.verticalLine(offset, lineLength);
        for (let col = 1; col <= this.columnsTotal; col++) {
            this.verticalLine(Math.floor(col * gridSize + offset), lineLength);
        }
    }

    /** columns: vertical lines placed according to the alternating `vGaps` pattern. */
    private drawColumns(gridSize: number, offset: number): void {
        if (!this.vGaps) return;
        for (const col of gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset));
        }
    }

    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    private drawRows(gridSize: number, offset: number): void {
        if (!this.hGaps || !this.vGaps) return;
        const verticalRange = Math.floor(this.gridHeight / gridSize + 1e-9);

        // Draw horizontals first, remember where the last one actually lands —
        // the gap pattern usually stops short of `verticalRange`.
        let lastRow = 0;
        for (const row of gapPattern(verticalRange, this.hGaps)) {
            lastRow = row;
            this.horizontalLine(Math.floor(row * gridSize + offset));
        }

        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : lastRow * gridSize + offset;

        for (const col of gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset), lineLength);
        }
    }

    /**
     * Renders the grid in a single canvas path, dispatching to the grid-type
     * specific helper. Stroke style and width are applied after the path is built.
     */
    private draw() {
        this.context.beginPath();

        const gridSize = this.gridWidth / this.columnsTotal;
        const offset = this.lineWidthCanvas / 2;

        switch (this._gridType) {
            case 'baseline': this.drawBaseline(gridSize, offset); break;
            case 'squared':  this.drawSquared(gridSize, offset); break;
            case 'columns':  this.drawColumns(gridSize, offset); break;
            case 'rows':     this.drawRows(gridSize, offset); break;
            default: {
                // Exhaustiveness check — fails the build if a new GridType is added without a handler.
                const _exhaustive: never = this._gridType;
                throw new Error(`Unhandled gridType: ${String(_exhaustive)}`);
            }
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
