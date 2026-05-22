type ColumnsInput = number | string | number[];
interface GridOptions {
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
export declare class CanvasGridLines {
    readonly container: HTMLElement;
    columnsTotal: number;
    columnsRaw: number[];
    lineWidth: number;
    gridType: string;
    color: string;
    readonly units: string;
    readonly extend: boolean;
    private hGaps;
    private vGaps;
    private ratio;
    private gridHeight;
    private gridWidth;
    private canvasHeight;
    private canvasWidth;
    private lineWidthCanvas;
    private canvas;
    private context;
    private isInitialized;
    private resizeHandler;
    constructor(container: HTMLElement, options?: GridOptions);
    private parseColumns;
    private validateColumns;
    private applyColumns;
    private initialize;
    private observeForVisibility;
    set columns(value: ColumnsInput);
    private scale;
    private gapPattern;
    private horizontalLine;
    private verticalLine;
    private drawBaseline;
    private drawSquared;
    private drawColumns;
    private drawRows;
    private draw;
}
export declare const canvasGridLines: {
    grids: CanvasGridLines[];
    elementsArray: HTMLElement[];
    initGrid(options: InitGridOptions): CanvasGridLines[] | undefined;
    setColumns(columns: ColumnsInput): void;
    getGrid(element: HTMLElement): CanvasGridLines | undefined;
};
export {};
