"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvasGridLines = exports.CanvasGridLines = void 0;
class CanvasGridLines {
    constructor(container, options = {}) {
        this.hGaps = null;
        this.vGaps = null;
        this.ratio = 0;
        this.gridHeight = 0;
        this.gridWidth = 0;
        this.canvasHeight = 0;
        this.canvasWidth = 0;
        this.lineWidthCanvas = 0;
        // needed for postponing initialisation when element is invisible
        this.isInitialized = false;
        this.resizeHandler = () => this.scale();
        this.container = container;
        this.gridType = options.gridType ?? this.container.getAttribute('data-grid-type') ?? 'columns';
        this.color = options.color ?? this.container.getAttribute('data-grid-color') ?? '#000000';
        this.lineWidth = options.lineWidth ?? parseInt(this.container.getAttribute('data-grid-line') ?? '1', 10);
        this.units = options.units ?? this.container.getAttribute('data-grid-units') ?? 'layoutpixel';
        this.extend = options.extend ?? true;
        const rawColumns = options.columns
            ?? this.container.getAttribute('data-grid-columns')
            ?? '12';
        this.applyColumns(rawColumns);
        // Only initialise when element has dimensions (is visible)
        if (this.container.offsetWidth > 0 && this.container.offsetHeight > 0) {
            this.initialize();
        }
        else {
            // Otherwise set visbility observer
            this.observeForVisibility();
        }
    }
    parseColumns(raw) {
        let values;
        if (typeof raw === 'number') {
            values = [raw];
        }
        else if (typeof raw === 'string') {
            values = raw.split(',').map(s => {
                const trimmed = s.trim();
                const n = Number(trimmed);
                if (!Number.isInteger(n) || n <= 0) {
                    throw new Error(`Invalid columns value "${trimmed}": must be a positive integer`);
                }
                return n;
            });
        }
        else if (Array.isArray(raw)) {
            values = raw.map(n => {
                if (!Number.isInteger(n) || n <= 0) {
                    throw new Error(`Invalid columns value "${n}": must be a positive integer`);
                }
                return n;
            });
        }
        else {
            throw new Error('columns must be a number, comma-separated string, or number array');
        }
        return values;
    }
    validateColumns(values, gridType) {
        const expected = {
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
                rows: 'total, h_gap1, h_gap2, v_gap1, v_gap2',
            }[gridType];
            throw new Error(`gridType "${gridType}" requires exactly ${want} columns value${want > 1 ? 's' : ''} (${shape})`);
        }
    }
    applyColumns(raw) {
        const values = this.parseColumns(raw);
        this.validateColumns(values, this.gridType);
        this.columnsRaw = values;
        this.columnsTotal = values[0];
        if (this.gridType === 'columns') {
            this.hGaps = null;
            this.vGaps = [values[1], values[2]];
        }
        else if (this.gridType === 'rows') {
            this.hGaps = [values[1], values[2]];
            this.vGaps = [values[3], values[4]];
        }
        else {
            this.hGaps = null;
            this.vGaps = null;
        }
    }
    initialize() {
        // prevent repetition
        if (this.isInitialized)
            return;
        if (window.getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.container.setAttribute('data-grid', 'initialised');
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');
        this.isInitialized = true;
        this.scale();
        window.addEventListener('resize', this.resizeHandler);
    }
    observeForVisibility() {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                // When element becomes visible
                if (entry.isIntersecting) {
                    this.initialize();
                    // end observer as element is initialised now
                    obs.unobserve(this.container);
                }
            });
        }, { threshold: 0.01 }); // threshold > 0 for making sure element has become visible
        observer.observe(this.container);
    }
    set columns(value) {
        this.applyColumns(value);
        // only apply to initialised elements
        if (this.isInitialized) {
            this.scale();
        }
    }
    scale() {
        // handle window for SSR
        if (typeof window === 'undefined')
            return;
        // Abort if element has no dimensions.
        // This will be the case when a formerly visible element becomes hidden
        if (this.container.offsetHeight === 0 || this.container.offsetWidth === 0) {
            return;
        }
        // determine the actual ratio we want to draw at
        this.ratio = window.devicePixelRatio || 1;
        // set lineWidth
        this.lineWidthCanvas = this.units === 'layoutpixel' ? this.lineWidth / this.ratio : this.lineWidth;
        // margin for lines on the canvas edges
        let marginX = (['squared', 'columns'].includes(this.gridType) || this.extend === true) ? this.lineWidthCanvas : 0;
        let marginY = ['squared', 'baseline', 'rows'].includes(this.gridType) ? this.lineWidthCanvas : 0;
        this.gridHeight = this.container.offsetHeight * this.ratio;
        this.gridWidth = this.container.offsetWidth * this.ratio;
        this.canvasHeight = this.gridHeight + marginY;
        this.canvasWidth = this.gridWidth + marginX;
        // set the 'real' canvas size to the higher width/height
        this.canvas.height = this.canvasHeight;
        this.canvas.width = this.canvasWidth;
        // then position it
        this.canvas.style.margin = `${marginY * -0.5 / this.ratio}px ${marginX * -0.5 / this.ratio}px`;
        // then scale it back down with CSS
        this.canvas.style.width = this.canvasWidth / this.ratio + 'px';
        this.canvas.style.height = this.canvasHeight / this.ratio + 'px';
        this.context.setTransform(1, 0, 0, 1, 0, 0); // Reset the transform
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
    }
    *gapPattern(max, gaps) {
        let pos = 0;
        let i = 0;
        while (pos <= max) {
            yield pos;
            pos += gaps[i % 2];
            i++;
        }
    }
    horizontalLine(y, length = this.canvasWidth) {
        this.context.moveTo(0, y);
        this.context.lineTo(length, y);
    }
    verticalLine(x, length = this.canvasHeight) {
        this.context.moveTo(x, 0);
        this.context.lineTo(x, length);
    }
    drawBaseline(gridSize, offset) {
        this.horizontalLine(offset);
        for (let y = gridSize; y <= this.gridHeight; y += gridSize) {
            const linePosition = y + offset;
            this.horizontalLine(Math.floor(linePosition + offset));
        }
    }
    drawSquared(gridSize, offset) {
        this.drawBaseline(gridSize, offset);
        const lineLength = (Math.floor(this.gridHeight / gridSize) * gridSize) + offset;
        this.verticalLine(offset, lineLength);
        let previousPosition = 0;
        for (let x = 1; x <= this.columnsTotal; x += 1) {
            const linePosition = ((this.gridWidth - previousPosition) / (this.columnsTotal - x + 1)) + previousPosition;
            this.verticalLine(Math.floor(linePosition + offset), lineLength);
            previousPosition = linePosition;
        }
    }
    drawColumns(gridSize, offset) {
        if (!this.vGaps)
            return;
        for (const col of this.gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset));
        }
    }
    drawRows(gridSize, offset) {
        if (!this.hGaps || !this.vGaps)
            return;
        const verticalRange = Math.floor(this.gridHeight / gridSize);
        const lineLength = verticalRange * gridSize + offset;
        for (const row of this.gapPattern(verticalRange, this.hGaps)) {
            this.horizontalLine(Math.floor(row * gridSize + offset));
        }
        for (const col of this.gapPattern(this.columnsTotal, this.vGaps)) {
            this.verticalLine(Math.floor(col * gridSize + offset), lineLength);
        }
    }
    draw() {
        this.context.beginPath();
        const gridSize = this.gridWidth / this.columnsTotal;
        const offset = this.lineWidthCanvas / 2;
        switch (this.gridType) {
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
        }
        this.context.strokeStyle = this.color;
        this.context.lineWidth = this.lineWidthCanvas;
        this.context.stroke();
    }
}
exports.CanvasGridLines = CanvasGridLines;
exports.canvasGridLines = {
    grids: [],
    elementsArray: [],
    initGrid(options) {
        const { targets, ...gridOptions } = options;
        if (!targets) {
            throw new Error('No selector for elements given');
        }
        if (typeof targets === 'string') {
            let elementsNodeList;
            try {
                elementsNodeList = document.querySelectorAll(targets);
            }
            catch (error) {
                throw new Error(`Invalid selector: ${targets}`);
            }
            this.elementsArray = Array.from(elementsNodeList);
        }
        else {
            if (targets instanceof NodeList) {
                this.elementsArray.push(...Array.from(targets));
            }
            else {
                this.elementsArray.push(targets);
            }
        }
        if (this.elementsArray.length) {
            const newGrids = this.elementsArray.map(element => new CanvasGridLines(element, gridOptions));
            this.grids.push(...newGrids);
            this.elementsArray = [];
            return newGrids;
        }
    },
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