export declare enum Units {
    LayoutPixel = "layoutPixel",
    DevicePixel = "devicePixel"
}
interface GridOptions {
    columns?: number;
    lineWidth?: number;
    gridType?: string;
    color?: string;
    units?: Units;
    extend?: boolean;
}
interface InitGridOptions extends GridOptions {
    targets: string | HTMLElement | NodeListOf<HTMLElement>;
}
export declare class CanvasGridLines {
    readonly container: HTMLElement;
    columns: number;
    lineWidth: number;
    readonly extend: boolean;
    gridType: string;
    color: string;
    readonly units: Units;
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
    private initialize;
    private observeForVisibility;
    set columnCount(count: number);
    private scale;
    private draw;
}
export declare const canvasGridLines: {
    grids: CanvasGridLines[];
    elementsArray: HTMLElement[];
    initGrid(options: InitGridOptions): CanvasGridLines[] | undefined;
    setColumns(columns: number): void;
    getGrid(element: HTMLElement): CanvasGridLines | undefined;
};
export {};
