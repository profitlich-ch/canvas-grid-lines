"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvasGridLines = exports.CanvasGridLines = void 0;
const types_1 = require("./types");
const constants_1 = require("./constants");
const gridTypeConfig_1 = require("./gridTypeConfig");
const parseColumns_1 = require("./parseColumns");
const gapPattern_1 = require("./gapPattern");
/**
 * Draws a crisp grid onto an HTML canvas appended to `container`.
 *
 * Each instance owns one container element and one canvas. The canvas is
 * resized and redrawn on window resize, and on demand via the setters for
 * `columns`, `gridType`, `color` and `lineWidth`. Containers that are not
 * visible at construction time are observed and initialised lazily once they
 * enter the viewport.
 */
class CanvasGridLines {
    constructor(container, options = {}) {
        /** Alternating gap pattern for horizontal lines (rows gridType only). */
        this.hGaps = null;
        /** Alternating gap pattern for vertical lines (columns + rows gridType). */
        this.vGaps = null;
        this.ratio = 0;
        this.gridHeight = 0;
        this.gridWidth = 0;
        this.canvasHeight = 0;
        this.canvasWidth = 0;
        this.lineWidthCanvas = 0;
        /** False until the canvas has been created — guards lazy initialisation. */
        this.isInitialized = false;
        this.resizeHandler = () => this.scale();
        this.container = container;
        // gridType — explicit option wins, then HTML data attribute, then default. Validated.
        const gridTypeRaw = options.gridType ?? container.getAttribute('data-grid-type') ?? constants_1.DEFAULT_GRID_TYPE;
        if (!(0, types_1.isGridType)(gridTypeRaw)) {
            throw new Error(`Invalid gridType "${gridTypeRaw}"`);
        }
        this._gridType = gridTypeRaw;
        // units — same resolution chain, validated.
        const unitsRaw = options.units ?? container.getAttribute('data-grid-units') ?? constants_1.DEFAULT_UNITS;
        if (!(0, types_1.isUnits)(unitsRaw)) {
            throw new Error(`Invalid units "${unitsRaw}"`);
        }
        this.units = unitsRaw;
        this._color = options.color ?? container.getAttribute('data-grid-color') ?? constants_1.DEFAULT_COLOR;
        const lineWidthAttr = container.getAttribute('data-grid-line');
        this._lineWidth = options.lineWidth ?? (lineWidthAttr !== null ? parseInt(lineWidthAttr, 10) : constants_1.DEFAULT_LINE_WIDTH);
        const terminationRaw = options.termination
            ?? container.getAttribute('data-grid-termination')
            ?? constants_1.DEFAULT_TERMINATION;
        if (!(0, types_1.isTermination)(terminationRaw)) {
            throw new Error(`Invalid termination "${terminationRaw}"`);
        }
        this.termination = terminationRaw;
        const rawColumns = options.columns
            ?? container.getAttribute('data-grid-columns')
            ?? constants_1.DEFAULT_COLUMNS;
        this.applyColumnsInput(rawColumns);
        // Initialise immediately if visible, otherwise defer until the container enters the viewport.
        if (container.offsetWidth > 0 && container.offsetHeight > 0) {
            this.initialize();
        }
        else {
            this.observeForVisibility();
        }
    }
    /** Pure-helper wrapper that copies the result into the instance fields. */
    applyColumnsInput(raw) {
        const result = (0, parseColumns_1.applyColumns)(raw, this._gridType);
        this.columnsTotal = result.columnsTotal;
        this.columnsRaw = result.columnsRaw;
        this.hGaps = result.hGaps;
        this.vGaps = result.vGaps;
    }
    /**
     * Creates the canvas, attaches it to the container and triggers the first draw.
     * Idempotent — repeated calls are a no-op once initialised.
     */
    initialize() {
        if (this.isInitialized)
            return;
        // The canvas is absolutely positioned over the container; the container
        // must therefore establish a positioning context.
        if (window.getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.container.setAttribute(constants_1.INIT_MARKER_ATTR, 'true');
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');
        this.isInitialized = true;
        this.scale();
        window.addEventListener('resize', this.resizeHandler);
    }
    /**
     * Watches a not-yet-visible container and initialises it the moment it
     * intersects the viewport. The observer disconnects after the first hit.
     */
    observeForVisibility() {
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
    get gridType() { return this._gridType; }
    /**
     * Switches the grid type live. Re-derives the per-axis gap patterns from
     * the existing `columns` value — will throw if the current `columns`
     * length does not fit the new grid type (set a compatible `columns` first).
     */
    set gridType(value) {
        if (!(0, types_1.isGridType)(value)) {
            throw new Error(`Invalid gridType "${value}"`);
        }
        this._gridType = value;
        this.applyColumnsInput(this.columnsRaw);
        if (this.isInitialized)
            this.scale();
    }
    get color() { return this._color; }
    /** Updates the stroke colour and redraws (no layout change). */
    set color(value) {
        this._color = value;
        if (this.isInitialized)
            this.redraw();
    }
    get lineWidth() { return this._lineWidth; }
    /** Updates the line width; rescales because edge margins depend on it. */
    set lineWidth(value) {
        this._lineWidth = value;
        if (this.isInitialized)
            this.scale();
    }
    get columns() { return this.columnsRaw; }
    /** Updates the grid columns / gap pattern and redraws. */
    set columns(value) {
        this.applyColumnsInput(value);
        if (this.isInitialized)
            this.scale();
    }
    /**
     * Resizes the canvas to match the container's current pixel dimensions
     * (taking devicePixelRatio into account) and triggers a redraw.
     *
     * Aborts silently when the container has zero dimensions — this happens
     * when a previously visible container becomes hidden.
     */
    scale() {
        // SSR guard.
        if (typeof window === 'undefined')
            return;
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
        const config = gridTypeConfig_1.GRID_TYPE_CONFIG[this._gridType];
        const marginX = this.lineWidthCanvas;
        const marginY = config.hasHorizontalEdgeLine ? this.lineWidthCanvas : 0;
        this.gridWidth = this.container.offsetWidth * this.ratio;
        const rawHeight = this.container.offsetHeight * this.ratio;
        if (this.termination === 'extend' && this._gridType !== 'columns') {
            // Round up to the next full grid row so a horizontal line closes the bottom edge.
            const gridSize = this.gridWidth / this.columnsTotal;
            this.gridHeight = Math.ceil(rawHeight / gridSize) * gridSize;
        }
        else {
            this.gridHeight = rawHeight;
        }
        // Round up to whole device pixels: `canvas.height/width` are unsigned
        // ints (browser truncates float assignments), and truncation can clip
        // the bottom/right edge line by half a pixel under float drift.
        this.canvasHeight = Math.ceil(this.gridHeight + marginY);
        this.canvasWidth = Math.ceil(this.gridWidth + marginX);
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
    redraw() {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
    }
    /** Draws a horizontal line at `y`, spanning the full canvas width by default. */
    horizontalLine(y, length = this.canvasWidth) {
        this.context.moveTo(0, y);
        this.context.lineTo(length, y);
    }
    /** Draws a vertical line at `x`, spanning the full canvas height by default. */
    verticalLine(x, length = this.canvasHeight) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, length);
    }
    /** baseline: one horizontal line per grid unit, full width. */
    drawBaseline(gridSize, offset) {
        for (let y = 0; y <= this.gridHeight; y += gridSize) {
            this.horizontalLine(Math.floor(y + offset));
        }
    }
    /** squared: baseline pattern plus one vertical line per grid unit. */
    drawSquared(gridSize, offset) {
        this.drawBaseline(gridSize, offset);
        // `fill`: vertical lines run to the canvas edge; otherwise they stop at the
        // last horizontal line (last full grid row).
        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : Math.floor(this.gridHeight / gridSize) * gridSize + offset;
        this.verticalLine(offset, lineLength);
        for (let col = 1; col <= this.columnsTotal; col++) {
            this.verticalLine(Math.floor(col * gridSize + offset), lineLength);
        }
    }
    /** columns: vertical lines placed according to the alternating `vGaps` pattern. */
    drawColumns(gridSize, offset) {
        if (!this.vGaps)
            return;
        for (const col of (0, gapPattern_1.gapPattern)(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset));
        }
    }
    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    drawRows(gridSize, offset) {
        if (!this.hGaps || !this.vGaps)
            return;
        const verticalRange = Math.floor(this.gridHeight / gridSize);
        // Draw horizontals first, remember where the last one actually lands —
        // the gap pattern usually stops short of `verticalRange`.
        let lastRow = 0;
        for (const row of (0, gapPattern_1.gapPattern)(verticalRange, this.hGaps)) {
            lastRow = row;
            this.horizontalLine(Math.floor(row * gridSize + offset));
        }
        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : lastRow * gridSize + offset;
        for (const col of (0, gapPattern_1.gapPattern)(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset), lineLength);
        }
    }
    /**
     * Renders the grid in a single canvas path, dispatching to the grid-type
     * specific helper. Stroke style and width are applied after the path is built.
     */
    draw() {
        this.context.beginPath();
        const gridSize = this.gridWidth / this.columnsTotal;
        const offset = this.lineWidthCanvas / 2;
        switch (this._gridType) {
            case 'baseline':
                this.drawBaseline(gridSize, offset);
                break;
            case 'squared':
                this.drawSquared(gridSize, offset);
                break;
            case 'columns':
                this.drawColumns(gridSize, offset);
                break;
            case 'rows':
                this.drawRows(gridSize, offset);
                break;
            default: {
                // Exhaustiveness check — fails the build if a new GridType is added without a handler.
                const _exhaustive = this._gridType;
                throw new Error(`Unhandled gridType: ${String(_exhaustive)}`);
            }
        }
        this.context.strokeStyle = this._color;
        this.context.lineWidth = this.lineWidthCanvas;
        this.context.stroke();
    }
}
exports.CanvasGridLines = CanvasGridLines;
/**
 * Convenience facade for bulk-managing grids.
 *
 * Use `initGrid` to construct one `CanvasGridLines` per matched element,
 * `setColumns` to update them all at once, and `getGrid` to look one up by
 * its container element.
 */
exports.canvasGridLines = {
    grids: [],
    /**
     * Creates a `CanvasGridLines` for each element matched by `targets`
     * (CSS selector, single HTMLElement or NodeList) and stores them in `grids`.
     * Per-element configuration via `data-grid-*` attributes wins unless the
     * caller passes an explicit option. Always returns an array (possibly empty).
     */
    initGrid(options) {
        const { targets, ...gridOptions } = options;
        if (!targets) {
            throw new Error('No selector for elements given');
        }
        const elements = [];
        if (typeof targets === 'string') {
            let elementsNodeList;
            try {
                elementsNodeList = document.querySelectorAll(targets);
            }
            catch (error) {
                throw new Error(`Invalid selector: ${targets}`);
            }
            elements.push(...Array.from(elementsNodeList));
        }
        else if (targets instanceof NodeList) {
            elements.push(...Array.from(targets));
        }
        else {
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
    setColumns(columns) {
        this.grids.forEach(grid => {
            grid.columns = columns;
        });
    },
    getGrid(element) {
        return this.grids.find(grid => grid.container === element);
    },
};
//# sourceMappingURL=index.js.map