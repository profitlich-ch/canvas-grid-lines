export enum Units {
    LayoutPixel = "layoutPixel",
    DevicePixel = "devicePixel",
}

interface GridOptions {
    columns?: number;
    lineWidth?: number;
    gridType?: string;
    color?: string;
    units?: Units;
    extend?: boolean;
}

class CanvasGridLines {

    private container: HTMLElement;
    private columns: number;
    private lineWidth: number;
    private gridType: string;
    private color: string;
    private units: Units;
    private extend: boolean;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private ratio: number = 0;
    private gridHeight: number = 0;
    private gridWidth: number = 0;
    private canvasHeight: number= 0;
    private canvasWidth: number = 0;
    private lineWidthCanvas: number = 0;

    constructor(
        container: HTMLElement,
        options: GridOptions = {}
    ) {
        this.container = container;
        this.columns = options.columns ?? parseInt(this.container.getAttribute('data-grid-columns') ?? '12', 10);
        this.gridType = options.gridType ?? this.container.getAttribute('data-grid') ?? 'columns';
        this.color = options.color ?? this.container.getAttribute('data-grid-color') ?? '#000000';
        
        // Für die restlichen Properties können wir einfachere Defaults nehmen
        this.lineWidth = options.lineWidth ?? 0.5;
        this.units = options.units ?? Units.LayoutPixel;
        this.extend = options.extend ?? false;
        if (window.getComputedStyle(container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        
        this.scale();
        window.addEventListener('resize', () => {
            this.scale();
        });
    }

    set columnCount(count: number) {
        this.columns = count;
        document.addEventListener('DOMContentLoaded', () => {
            this.scale();
        });
    }

    private scale() {

        // handle window for SSR
        if (typeof window === 'undefined') return null;

        // determine the actual ratio we want to draw at
        this.ratio = window.devicePixelRatio || 1;
        
        // set lineWidth
        this.lineWidthCanvas = this.units === Units.LayoutPixel ? this.lineWidth / this.ratio : this.lineWidth;
        
        // margin for lines on the canvas edges
        let marginX: number = (['squared', 'columns'].includes(this.gridType) || this.extend === true) ? this.lineWidthCanvas : 0;
        let marginY: number = ['squared', 'baseline', 'rows'].includes(this.gridType) ? this.lineWidthCanvas : 0;
        
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
        this.draw();
    }

    private draw() {
        let gridSize = this.gridWidth / this.columns;
        let offset = this.lineWidthCanvas / 2;

        // Draw horizontal lines 
        if (this.gridType === 'baseline' || this.gridType === 'squared') {
            // Draw first line
            this.context.moveTo(0, offset);
            this.context.lineTo(this.canvasWidth, offset);
            
            let previousPosition = 0;
            for (let y = gridSize; y <= this.gridHeight; y += gridSize) {
                let linePosition = y + offset;
                // not until the line is drawn it moved onto an actual pixel
                this.context.moveTo(0, Math.floor(linePosition + offset));
                this.context.lineTo(this.canvasWidth, Math.floor(linePosition + offset));
                previousPosition = linePosition;
            }
        }
        
        // Draw vertical lines 
        if (this.gridType === 'squared') {
            let lineLength = (Math.floor(this.gridHeight / gridSize) * gridSize) + offset;

            // Draw first line
            this.context.moveTo(offset, 0);
            this.context.lineTo(offset, lineLength);

            let previousPosition = 0;
            for (let x = 1; x <= this.columns; x += 1) {
                let linePosition = ((this.gridWidth - previousPosition) / (this.columns - x + 1)) + previousPosition;
                // not until the line is drawn it moved onto an actual pixel
                this.context.moveTo(Math.floor(linePosition + offset), 0);
                this.context.lineTo(Math.floor(linePosition + offset), lineLength);
                previousPosition = linePosition;
            }
        }

        // Draw columns
        if (this.gridType == 'columns') {
            // Draw first line
            this.context.moveTo(offset, 0);
            this.context.lineTo(offset, this.canvasHeight);
            let previousPosition = 0;
            
            // A line is drawn every 5 grid columns
            // with i at 0, 5, 10, …
            let i = 1;
            // with j at 4, 9, 14, … (starting 1 columns earlier)
            let j = 2;
            for (let x = 1; x <= this.columns; x += 1) {
                let linePosition = ((this.gridWidth - previousPosition) / (this.columns - x + 1)) + previousPosition;
                if (i % 5 === 0 || j % 5 === 0) {
                    this.context.moveTo(Math.floor(linePosition + offset), 0);
                    this.context.lineTo(Math.floor(linePosition + offset), this.canvasHeight);
                }
                i++;
                j++;
                previousPosition = linePosition;
            }
        }

        // Draw rows
        if (this.gridType === 'rows') {
            let lineLength = (Math.floor(this.gridHeight / gridSize) * gridSize) + offset;

            // Draw first horizontal line
            this.context.moveTo(0, offset);
            this.context.lineTo(this.canvasWidth, offset);

            // Horizontal lines
            // A line is set every 5 grid rows
            // with i at 0, 5, 10, …
            let i = 0;
            // with j at 6, 11, 16, … (starting 1 rows earlier)
            let j = 1;
            for (let y = 0; y <= this.canvas.height; y += gridSize) {
                if (i % 6 === 0 || j % 6 === 0) {
                    this.context.moveTo(0, Math.round(y + this.lineWidthCanvas));
                    this.context.lineTo(this.canvas.width, Math.round(y + this.lineWidthCanvas));
                }
                i++;
                j++;
            }

            // Vertical lines
            let k = 0;
            for (let x = 0; x <= this.canvas.width; x += gridSize) {
                if (k % 5 === 0 && k !== 0) {
                    this.context.moveTo(Math.round(x + this.lineWidthCanvas), 0);
                    this.context.lineTo(Math.round(x + this.lineWidthCanvas), lineLength);
                }
                k++;
            }
        }

        this.context.strokeStyle = this.color;
        this.context.lineWidth = this.lineWidthCanvas;
        this.context.stroke();
    }
}

export const canvasGridLines = {
    Units,
    grids: [] as CanvasGridLines[],
    elementsArray: [] as HTMLElement[],

    initGrid(
        targets: string | HTMLElement,
        options?: GridOptions,
    ) {
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
            this.elementsArray.push(targets);
        }

        if (this.elementsArray.length) {
            this.grids = this.elementsArray.map(element => new CanvasGridLines(element, options));
            this.elementsArray = [];
            return this.grids;
        }
    },

    setColumns(columns: number) {
        this.grids.forEach(grid => {
            grid.columnCount = columns;
            
        });
    }
}