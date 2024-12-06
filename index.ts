class CanvasGridLines {
    private container: HTMLElement;
    private columns: number;
    private lineWidth: number;
    private units: string;
    private color: string;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gridType: string;
    private ratio: number = 0;
    private gridHeight: number = 0;
    private gridWidth: number = 0;
    private canvasHeight: number= 0;
    private canvasWidth: number = 0;
    private lineWidthCanvas: number = 0;

    constructor(
        container: HTMLElement,
        columns: number,
        lineWidth: number = 0.5,
        units: string = 'layout',
        color: string = 'black'
    ) {
        this.container = container;
        this.columns = columns;
        this.lineWidth = lineWidth as number;
        this.units = units as string;
        this.color = color as string;
        if (window.getComputedStyle(container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.gridType = this.container.getAttribute('data-grid') as string;

        this.scale();
        window.addEventListener('resize', () => {
            this.scale();
        });
    }

    set columnCount(count: number) {
        this.columns = count;
        this.scale();
    }

    private scale() {

        // handle window for SSR
        if (typeof window === 'undefined') return null;

        // determine the actual ratio we want to draw at
        this.ratio = window.devicePixelRatio || 1;
        
        // set lneWidth
        this.lineWidthCanvas = this.units === 'pixel' ? this.lineWidth / this.ratio : this.lineWidth;
        
        // margin for lines on the canvas edges
        let marginX: number = ['squared', 'columns'].includes(this.gridType) ? this.lineWidthCanvas : 0;
        let marginY: number = ['squared', 'baseline', 'rows'].includes(this.gridType) ? this.lineWidthCanvas : 0;
        
        this.gridHeight = this.container.offsetHeight * this.ratio;
        this.gridWidth = this.container.offsetWidth * this.ratio;
        this.canvasHeight = this.gridHeight + marginY;
        this.canvasWidth = this.gridWidth + marginX;

        // set the 'real' canvas size to the higher width/height
        this.canvas.height = this.canvasHeight;
        this.canvas.width = this.canvasWidth;

        // then position it
        this.canvas.style.margin = `${marginX * -0.5 / this.ratio}px ${marginY * -0.5 / this.ratio}px`;

        // then scale it back down with CSS
        this.canvas.style.width = this.canvasWidth / this.ratio + 'px';
        this.canvas.style.height = this.canvasHeight / this.ratio + 'px';

        this.context.setTransform(1, 0, 0, 1, 0, 0); // Reset the transform
        this.draw();
    }

    private draw() {
        let gridSize = this.gridHeight / this.columns;

        // Draw horizontal lines 
        if (this.gridType === 'baseline' || this.gridType === 'squared') {
            for (let y = 0; y <= this.canvas.height; y += gridSize) {
                this.context.moveTo(0, Math.round(y));
                this.context.lineTo(this.canvas.width, Math.round(y));
            }
        }
        
        // Draw vertical lines 
        if (this.gridType === 'squared') {
            let offset = this.lineWidthCanvas / 2;
            this.context.moveTo(offset, 0);
            this.context.lineTo(offset, this.canvasHeight);
            let previousPosition = 0;
            console.log(this.gridWidth, this.canvasWidth, this.lineWidthCanvas, this.ratio);
            for (let x = 1; x <= this.columns; x += 1) {
                let linePosition = ((this.gridWidth - previousPosition) / (this.columns - x + 1)) + previousPosition + offset;
                // not until the line is drawn it moved onto an actual pixel
                this.context.moveTo(Math.floor(linePosition), 0);
                this.context.lineTo(Math.floor(linePosition), this.canvasHeight);
                console.log(x, linePosition);
                previousPosition = linePosition;
            }
        }

        // Draw columns
        if (this.gridType == 'columns') {
            // A line is set every 5 grid columns
            // with i at 0, 5, 10, …
            let i = 0;
            // with j at 4, 9, 14, … (starting 1 columns earlier)
            let j = 1;
            for (let x = 0; x <= this.canvas.width; x += gridSize) {
                if (i % 5 === 0 || j % 5 === 0) {
                    this.context.moveTo(Math.round(x + this.lineWidthCanvas / 2), 0);
                    this.context.lineTo(Math.round(x + this.lineWidthCanvas / 2), this.canvas.height);
                }
                i++;
                j++;
            }
        }

        // Draw rows
        if (this.gridType === 'rows') {
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
            let k = 0;
            for (let x = 0; x <= this.canvas.width; x += gridSize) {
                if (k % 5 === 0 && k !== 0) {
                    this.context.moveTo(Math.round(x + this.lineWidthCanvas), 0);
                    this.context.lineTo(Math.round(x + this.lineWidthCanvas), this.canvas.height);
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
    grids: [] as CanvasGridLines[],

    initGrid(targets: string, columns: number, lineWidth: number, units: string, color: string) {
        if (!targets) {
            throw new Error('No selector for elements given');
        }
        let elementsNodeList: NodeListOf<HTMLElement>;
        try {
            elementsNodeList = document.querySelectorAll<HTMLElement>(targets);
        } catch (error) {
            throw new Error(`Invalid selector: ${targets}`);
        }
        let elementsArray = Array.from(elementsNodeList);
        this.grids = elementsArray.map(element => new CanvasGridLines(element, columns, lineWidth, color));
        return this.grids;
    },

    setColumns(columns: number) {
        this.grids.forEach(grid => {
            grid.columnCount = columns;
            
        });
    }
}