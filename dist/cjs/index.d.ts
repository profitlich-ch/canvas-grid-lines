export declare enum Units {
    LayoutPixel = "layoutPixel",
    DevicePixel = "devicePixel"
}
declare class CanvasGridLines {
    private container;
    private columns;
    private lineWidth;
    private units;
    private extend;
    private canvas;
    private context;
    private gridType;
    private color;
    private ratio;
    private gridHeight;
    private gridWidth;
    private canvasHeight;
    private canvasWidth;
    private lineWidthCanvas;
    private isInitialized;
    private resizeHandler;
    constructor(container: HTMLElement, columns: number, lineWidth?: number, units?: Units, extend?: boolean);
    private initialize;
    private observeForVisibility;
    set columnCount(count: number);
    private scale;
    private draw;
}
export interface GridOptions {
    targets: string | HTMLElement;
    columns: number;
    lineWidth?: number;
    units?: Units;
    extend?: boolean;
}
export declare const canvasGridLines: {
    Units: typeof Units;
    grids: CanvasGridLines[];
    elementsArray: HTMLElement[];
    initGrid({ targets, columns, lineWidth, units, extend }: GridOptions): CanvasGridLines[] | undefined;
    setColumns(columns: number): void;
};
export {};
