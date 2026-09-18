"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvasGridLines = exports.CanvasGridLines = void 0;
const types_1 = require("./types");
const constants_1 = require("./constants");
const frameBatch_1 = require("./frameBatch");
const gridTypeConfig_1 = require("./gridTypeConfig");
const parseColumns_1 = require("./parseColumns");
const gapPattern_1 = require("./gapPattern");
const linePosition_1 = require("./linePosition");
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
        /** Canvas overhang before the container's left edge, in device pixels. */
        this.overhangLeft = 0;
        /** False until the canvas has been created — guards lazy initialisation. */
        this.isInitialized = false;
        this.resizeHandler = () => this.scale();
        /** Container size at the last `scale()`, recorded only with `observeResize`. */
        this.scaledWidth = -1;
        this.scaledHeight = -1;
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
        this.observeResize = options.observeResize
            ?? (0, types_1.parseBooleanAttribute)(container.getAttribute('data-grid-observe-resize'))
            ?? constants_1.DEFAULT_OBSERVE_RESIZE;
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
        // Kept alongside the observer: a devicePixelRatio change (browser zoom,
        // moving to another screen) fires `resize` but leaves the CSS size alone.
        window.addEventListener('resize', this.resizeHandler);
        if (this.observeResize)
            this.observeContainerResize();
    }
    /** Registers the container with the shared observer. No-op where ResizeObserver is missing. */
    observeContainerResize() {
        if (typeof ResizeObserver === 'undefined')
            return;
        CanvasGridLines.resizeObserver ?? (CanvasGridLines.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const grid = CanvasGridLines.observedGrids.get(entry.target);
                if (grid)
                    CanvasGridLines.queueResized(grid);
            }
        }));
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
    refreshIfResized() {
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
    refresh() {
        if (this.isInitialized)
            this.scale();
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
        const config = gridTypeConfig_1.GRID_TYPE_CONFIG[this._gridType];
        const marginX = this.lineWidthCanvas;
        const marginY = config.hasHorizontalEdgeLine ? this.lineWidthCanvas : 0;
        this.gridWidth = this.container.offsetWidth * this.ratio;
        const rawHeight = this.container.offsetHeight * this.ratio;
        // `extend` rounds the canvas up so a horizontal line can close the bottom
        // edge — meaningless for grid types that draw none.
        if (this.termination === 'extend' && config.hasHorizontalEdgeLine) {
            // Round up so a horizontal line closes the bottom edge. For `rows`
            // the horizontals only sit on hGaps-pattern positions, so round up
            // to the next pattern tickmark; otherwise to the next integer row.
            const gridSize = this.gridWidth / this.columnsTotal;
            const rawRows = rawHeight / gridSize;
            const targetRows = (this._gridType === 'rows' && this.hGaps)
                ? (0, gapPattern_1.nextGapTick)(rawRows - 1e-9, this.hGaps)
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
        }
        else {
            this.gridHeight = rawHeight;
        }
        this.canvasHeight = this.gridHeight + marginY;
        this.canvasWidth = this.gridWidth + marginX;
        // Physical canvas size (device pixels).
        this.canvas.height = this.canvasHeight;
        this.canvas.width = this.canvasWidth;
        // Negative margins pull the oversized canvas back over the top/left edge by
        // whole device pixels; the rest of the overhang lies past the bottom/right edge.
        this.overhangLeft = (0, linePosition_1.leadingOverhang)(marginX);
        const overhangTop = (0, linePosition_1.leadingOverhang)(marginY);
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
    recordScaledSize() {
        if (!this.observeResize)
            return;
        this.scaledWidth = this.container.offsetWidth;
        this.scaledHeight = this.container.offsetHeight;
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
        // Integer counter + epsilon: avoids float-accumulation drift in `y += gridSize`
        // and the float wobble that makes `gridHeight / gridSize` land at e.g. 17.999…
        // instead of 18 after `Math.ceil(rawHeight/gridSize) * gridSize` at termination='extend'.
        const lastN = Math.floor(this.gridHeight / gridSize + 1e-9);
        for (let n = 0; n <= lastN; n++) {
            this.horizontalLine((0, linePosition_1.linePosition)(n, gridSize, offset));
        }
    }
    /** squared: baseline pattern plus one vertical line per grid unit. */
    drawSquared(gridSize, offset) {
        this.drawBaseline(gridSize, offset);
        // `fill`: vertical lines run to the canvas edge; otherwise they stop at the
        // lower edge of the last horizontal line (last full grid row). Epsilon
        // matches `drawBaseline` so float drift doesn't drop the bottom row at
        // termination='extend'.
        const lastN = Math.floor(this.gridHeight / gridSize + 1e-9);
        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : Math.floor(lastN * gridSize) + this.lineWidthCanvas;
        for (let col = 0; col <= this.columnsTotal; col++) {
            this.verticalLine((0, linePosition_1.linePosition)(col, gridSize, offset), lineLength);
        }
    }
    /** columns: vertical lines placed according to the alternating `vGaps` pattern. */
    drawColumns(gridSize, offset) {
        if (!this.vGaps)
            return;
        for (const col of (0, gapPattern_1.gapPattern)(this.columnsTotal, this.vGaps)) {
            this.verticalLine((0, linePosition_1.linePosition)(col, gridSize, offset));
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
    drawRibbons(gridSize) {
        if (!this.vGaps)
            return;
        for (const [start, end] of (0, gapPattern_1.bandSpans)(this.columnsTotal, this.vGaps)) {
            const left = Math.floor(start * gridSize) + this.overhangLeft;
            const right = Math.floor(end * gridSize) + this.overhangLeft;
            this.context.rect(left, 0, right - left, this.canvasHeight);
        }
    }
    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    drawRows(gridSize, offset) {
        if (!this.hGaps || !this.vGaps)
            return;
        const verticalRange = Math.floor(this.gridHeight / gridSize + 1e-9);
        // Draw horizontals first, remember where the last one actually lands —
        // the gap pattern usually stops short of `verticalRange`.
        let lastRow = 0;
        for (const row of (0, gapPattern_1.gapPattern)(verticalRange, this.hGaps)) {
            lastRow = row;
            this.horizontalLine((0, linePosition_1.linePosition)(row, gridSize, offset));
        }
        const lineLength = this.termination === 'fill'
            ? this.canvasHeight
            : Math.floor(lastRow * gridSize) + this.lineWidthCanvas;
        for (const col of (0, gapPattern_1.gapPattern)(this.columnsTotal, this.vGaps)) {
            this.verticalLine((0, linePosition_1.linePosition)(col, gridSize, offset), lineLength);
        }
    }
    /**
     * Renders the grid in a single canvas path, dispatching to the grid-type
     * specific helper. Paint style is applied after the path is built: filled
     * types close their subpaths with `rect()` and get one `fill()`, all others
     * one `stroke()`. No type mixes the two, so a single path suffices.
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
            case 'ribbons':
                this.drawRibbons(gridSize);
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
        if (gridTypeConfig_1.GRID_TYPE_CONFIG[this._gridType].isFilled) {
            this.context.fillStyle = this._color;
            this.context.fill();
            return;
        }
        this.context.strokeStyle = this._color;
        this.context.lineWidth = this.lineWidthCanvas;
        this.context.stroke();
    }
}
exports.CanvasGridLines = CanvasGridLines;
/**
 * One observer for all grids with `observeResize`, created on first use.
 * A page often carries dozens of grids; one observer per grid would buy
 * nothing but bookkeeping.
 */
CanvasGridLines.resizeObserver = null;
CanvasGridLines.observedGrids = new Map();
/**
 * Redraws on the next frame, not inside the observer callback: `scale()`
 * changes `min-height` under `termination: 'extend'`, and a size change
 * inside the callback makes browsers report a "ResizeObserver loop" error.
 */
CanvasGridLines.queueResized = (0, frameBatch_1.createFrameBatch)(callback => window.requestAnimationFrame(callback), grid => grid.refreshIfResized());
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