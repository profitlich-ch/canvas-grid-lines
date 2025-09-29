export declare enum Units {
    LayoutPixel = "layoutPixel",
    DevicePixel = "devicePixel"
}
declare class CanvasGridLines {
    readonly container: HTMLElement;
    columns: number;
    lineWidth: number;
    readonly units: Units;
    readonly extend: boolean;
    private canvas;
    private context;
    gridType: string;
    color: string;
    private ratio;
    private gridHeight;
    private gridWidth;
    private canvasHeight;
    private canvasWidth;
    private lineWidthCanvas;
    private isInitialized;
    private resizeHandler;
    constructor(container: HTMLElement, columns: number, lineWidth?: number, units?: Units, extend?: boolean, overrideGridType?: string);
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
    gridType?: string;
}
export declare const canvasGridLines: {
    Units: typeof Units;
    grids: CanvasGridLines[];
    elementsArray: HTMLElement[];
    initGrid({ targets, columns, lineWidth, units, extend, gridType }: GridOptions): CanvasGridLines[] | undefined;
    setColumns(columns: number): void;
};
export {};
