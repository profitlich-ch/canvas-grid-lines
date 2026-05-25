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
export class CanvasGridLines {
    public readonly container: HTMLElement;

    /** First value of the parsed `columns` input — the grid resolution. */
    public columnsTotal!: number;
    /** Raw parsed `columns` array as supplied by the caller. */
    public columnsRaw!: number[];

    public lineWidth: number;
    public gridType: string;
    public color: string;
    public readonly units: string;
    public readonly extend: boolean;

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
        // For every option: explicit JS option wins, then HTML data attribute, then default.
        this.gridType = options.gridType ?? this.container.getAttribute('data-grid-type') ?? 'columns';
        this.color = options.color ?? this.container.getAttribute('data-grid-color') ?? '#000000';
        this.lineWidth = options.lineWidth ?? parseInt(this.container.getAttribute('data-grid-line') ?? '1', 10);
        this.units = options.units ?? this.container.getAttribute('data-grid-units') ?? 'layoutpixel';
        this.extend = options.extend ?? true;

        const rawColumns: ColumnsInput = options.columns
            ?? this.container.getAttribute('data-grid-columns')
            ?? '12';
        this.applyColumns(rawColumns);

        // Initialise immediately if visible, otherwise defer until the container enters the viewport.
        if (this.container.offsetWidth > 0 && this.container.offsetHeight > 0) {
            this.initialize();
        } else {
            this.observeForVisibility();
        }
    }

    /**
     * Normalises the `columns` input to a positive-integer array.
     * Throws on any non-integer, non-positive or non-parseable value.
     */
    private parseColumns(raw: ColumnsInput): number[] {
        let values: number[];
        if (typeof raw === 'number') {
            values = [raw];
        } else if (typeof raw === 'string') {
            values = raw.split(',').map(s => {
                const trimmed = s.trim();
                const n = Number(trimmed);
                if (!Number.isInteger(n) || n <= 0) {
                    throw new Error(`Invalid columns value "${trimmed}": must be a positive integer`);
                }
                return n;
            });
        } else if (Array.isArray(raw)) {
            values = raw.map(n => {
                if (!Number.isInteger(n) || n <= 0) {
                    throw new Error(`Invalid columns value "${n}": must be a positive integer`);
                }
                return n;
            });
        } else {
            throw new Error('columns must be a number, comma-separated string, or number array');
        }
        return values;
    }

    /**
     * Verifies the parsed array has the exact length required by the grid type.
     * Throws otherwise — there is no silent fallback.
     */
    private validateColumns(values: number[], gridType: string): void {
        const expected: Record<string, number> = {
            baseline: 1,
            squared: 1,
            columns: 3,
            rows: 5,
        };
        const want = expected[gridType];
        if (want === undefined) {
            throw new Error(`Unknown gridType "${gridType}"`);
        }
        if (values.length !== want) {
            const shape = {
                baseline: 'total',
                squared: 'total',
                columns: 'total, gap1, gap2',
                rows: 'total, v_gap1, v_gap2, h_gap1, h_gap2',
            }[gridType];
            throw new Error(`gridType "${gridType}" requires exactly ${want} columns value${want > 1 ? 's' : ''} (${shape})`);
        }
    }

    /**
     * Parses, validates and maps the `columns` input to the internal state
     * (`columnsTotal`, `hGaps`, `vGaps`) according to the active grid type.
     */
    private applyColumns(raw: ColumnsInput): void {
        const values = this.parseColumns(raw);
        this.validateColumns(values, this.gridType);
        this.columnsRaw = values;
        this.columnsTotal = values[0];
        if (this.gridType === 'columns') {
            this.hGaps = null;
            this.vGaps = [values[1], values[2]];
        } else if (this.gridType === 'rows') {
            this.vGaps = [values[1], values[2]];
            this.hGaps = [values[3], values[4]];
        } else {
            this.hGaps = null;
            this.vGaps = null;
        }
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
        this.container.setAttribute('data-grid', 'initialised');
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

    /**
     * Public setter for live grid updates. Re-parses the value with the same
     * rules as the constructor and redraws if the grid is already initialised.
     */
    set columns(value: ColumnsInput) {
        this.applyColumns(value);
        if (this.isInitialized) {
            this.scale();
        }
    }

    /**
     * Resizes the canvas to match the container's current pixel dimensions
     * (taking devicePixelRatio into account) and triggers a redraw.
     *
     * Called on construction, on window resize, and on every `columns` update.
     * Aborts silently when the container has zero dimensions — this happens
     * when a previously visible container becomes hidden.
     */
    private scale() {
        // SSR guard.
        if (typeof window === 'undefined') return;

        if (this.container.offsetHeight === 0 || this.container.offsetWidth === 0) {
            return;
        }

        this.ratio = window.devicePixelRatio || 1;

        // `lineWidth` is interpreted as CSS pixels (`layoutpixel`) or as physical
        // canvas pixels (`devicepixel`); the canvas always works in physical pixels.
        this.lineWidthCanvas = this.units === 'layoutpixel' ? this.lineWidth / this.ratio : this.lineWidth;

        // Edge lines would otherwise be clipped in half — extend the canvas by
        // one line width along axes that carry an edge line.
        let marginX: number = (['squared', 'columns'].includes(this.gridType) || this.extend === true) ? this.lineWidthCanvas : 0;
        let marginY: number = ['squared', 'baseline', 'rows'].includes(this.gridType) ? this.lineWidthCanvas : 0;

        this.gridHeight = this.container.offsetHeight * this.ratio;
        this.gridWidth = this.container.offsetWidth * this.ratio;
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

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
    }

    /**
     * Yields line positions (in grid units) following an alternating gap pattern.
     * Starts at 0, then advances by `gaps[0]`, `gaps[1]`, `gaps[0]`, `gaps[1]`, …
     * until `max` is exceeded. Example: `gaps=[2,3]` produces 0, 2, 5, 7, 10, …
     */
    private *gapPattern(max: number, gaps: [number, number]): Generator<number> {
        let pos = 0;
        let i = 0;
        while (pos <= max) {
            yield pos;
            pos += gaps[i % 2];
            i++;
        }
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
        this.horizontalLine(offset);

        for (let y = gridSize; y <= this.gridHeight; y += gridSize) {
            const linePosition = y + offset;
            this.horizontalLine(Math.floor(linePosition + offset));
        }
    }

    /** squared: baseline pattern plus one vertical line per grid unit. */
    private drawSquared(gridSize: number, offset: number): void {
        this.drawBaseline(gridSize, offset);

        // Vertical lines stop at the last full grid row so the bottom edge stays clean.
        const lineLength = (Math.floor(this.gridHeight / gridSize) * gridSize) + offset;

        this.verticalLine(offset, lineLength);

        let previousPosition = 0;
        for (let x = 1; x <= this.columnsTotal; x += 1) {
            const linePosition = ((this.gridWidth - previousPosition) / (this.columnsTotal - x + 1)) + previousPosition;
            this.verticalLine(Math.floor(linePosition + offset), lineLength);
            previousPosition = linePosition;
        }
    }

    /** columns: vertical lines placed according to the alternating `vGaps` pattern. */
    private drawColumns(gridSize: number, offset: number): void {
        if (!this.vGaps) return;
        for (const col of this.gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset));
        }
    }

    /**
     * rows: horizontal lines from `hGaps`, vertical lines from `vGaps`. Both
     * patterns share the same grid unit (`gridSize = gridWidth / columnsTotal`).
     */
    private drawRows(gridSize: number, offset: number): void {
        if (!this.hGaps || !this.vGaps) return;
        const verticalRange = Math.floor(this.gridHeight / gridSize);
        const lineLength = verticalRange * gridSize + offset;

        for (const row of this.gapPattern(verticalRange, this.hGaps)) {
            this.horizontalLine(Math.floor(row * gridSize + offset));
        }

        for (const col of this.gapPattern(this.columnsTotal, this.vGaps)) {
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

        switch (this.gridType) {
            case 'baseline': this.drawBaseline(gridSize, offset); break;
            case 'squared':  this.drawSquared(gridSize, offset); break;
            case 'columns':  this.drawColumns(gridSize, offset); break;
            case 'rows':     this.drawRows(gridSize, offset); break;
        }

        this.context.strokeStyle = this.color;
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
    elementsArray: [] as HTMLElement[],

    /**
     * Creates a `CanvasGridLines` for each element matched by `targets`
     * (CSS selector, single HTMLElement or NodeList) and stores them in `grids`.
     * Per-element configuration via `data-grid-*` attributes wins unless the
     * caller passes an explicit option.
     */
    initGrid(options: InitGridOptions) {
        const { targets, ...gridOptions } = options;

        if (!targets) {
            throw new Error('No selector for elements given');
        }
        if (typeof targets === 'string') {
            let elementsNodeList: NodeListOf<HTMLElement>;
            try {
                elementsNodeList = document.querySelectorAll(targets);
            } catch (error) {
                throw new Error(`Invalid selector: ${targets}`);
            }
            this.elementsArray = Array.from(elementsNodeList);
        } else {
            if (targets instanceof NodeList) {
                this.elementsArray.push(...Array.from(targets));
            } else {
                this.elementsArray.push(targets);
            }
        }

        if (this.elementsArray.length) {
            const newGrids = this.elementsArray.map(element =>
                new CanvasGridLines(element, gridOptions)
            );
            this.grids.push(...newGrids);
            this.elementsArray = [];
            return newGrids;
        }
    },

    /**
     * Re-applies the given `columns` value to every tracked grid. The value
     * must satisfy each grid's `gridType` constraints — passing e.g. a single
     * number to a mixed set including a `rows`-type grid will throw.
     */
    setColumns(columns: ColumnsInput) {
        this.grids.forEach(grid => {
            grid.columns = columns;
        });
    },

    getGrid(element: HTMLElement): CanvasGridLines | undefined {
        return this.grids.find(grid => grid.container === element);
    },
}
