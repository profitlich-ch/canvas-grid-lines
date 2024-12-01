class CanvasGridLines {
    private container: HTMLElement;
    private columns: number;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private gridType: string;
    private ratio: number;

    constructor(container: HTMLElement, columns: number) {
        this.container = container;
        this.columns = columns;
        if (window.getComputedStyle(container).position === 'static') {
            this.container.style.position = 'relative';
        }
        this.canvas = document.createElement('canvas');
        this.canvas.classList.add('test-grid__canvas');
        this.container.appendChild(this.canvas);
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.gridType = this.container.getAttribute('data-grid') as string;
        this.ratio = 0 as number;
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
        let width = this.container.offsetWidth;
        let height = this.container.offsetHeight;

        // Handle window for SSR
        if (typeof window === 'undefined') return null;

        // determine the actual ratio we want to draw at
        this.ratio = window.devicePixelRatio || 1;

        if (devicePixelRatio !== 1) {
            // set the 'real' canvas size to the higher width/height
            this.canvas.width = width * this.ratio;
            this.canvas.height = height * this.ratio;

            // then scale it back down with CSS
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
        } else {
            // this is a normal 1:1 device; just scale it simply
            this.canvas.width = width;
            this.canvas.height = height;
            this.canvas.style.width = '';
            this.canvas.style.height = '';
        }

        this.context.setTransform(1, 0, 0, 1, 0, 0); // Reset the transform
        // scale the drawing context so everything will work at the higher ratio
        this.context.scale(this.ratio, this.ratio);
        this.draw();
    }

    private draw() {
        const lineWidth = 0.5
        let gridSize = (this.canvas.width / this.ratio - lineWidth) / this.columns;

        // Draw horizontal lines 
        if (this.gridType === 'baseline' || this.gridType === 'squared') {
            for (let y = 0; y <= this.canvas.height; y += gridSize) {
                this.context.moveTo(0, Math.round(y + lineWidth));
                this.context.lineTo(this.canvas.width, Math.round(y + lineWidth));
            }
        }

        // Draw vertical lines 
        if (this.gridType === 'squared') {
            for (let x = 0; x <= this.canvas.width; x += gridSize) {
                this.context.moveTo(Math.round(x + lineWidth), 0);
                this.context.lineTo(Math.round(x + lineWidth), this.canvas.height);
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
                    this.context.moveTo(Math.round(x + lineWidth), 0);
                    this.context.lineTo(Math.round(x + lineWidth), this.canvas.height);
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
                    this.context.moveTo(0, Math.round(y + lineWidth));
                    this.context.lineTo(this.canvas.width, Math.round(y + lineWidth));
                }
                i++;
                j++;
            }
            let k = 0;
            for (let x = 0; x <= this.canvas.width; x += gridSize) {
                if (k % 5 === 0 && k !== 0) {
                    this.context.moveTo(Math.round(x + lineWidth), 0);
                    this.context.lineTo(Math.round(x + lineWidth), this.canvas.height);
                }
                k++;
            }
        }

        this.context.strokeStyle = 'black';
        this.context.lineWidth = lineWidth;
        this.context.stroke();
    }
}

export const canvasGridLines = {
    grids: [] as CanvasGridLines[],

    initGrid(targets: string, columns: number) {
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
        this.grids = elementsArray.map(element => new CanvasGridLines(element, columns));

        return this.grids;
    },

    setColumns(columns: number) {
        this.grids.forEach(grid => {
            grid.columnCount = columns;
            
        });
    }
}