import { canvasGridLines, CanvasGridLines } from './index';

// UMD consumers access the library as `window.canvasGridLines.initGrid(...)`.
// Attach the class as a property so it remains reachable without a second global.
(canvasGridLines as unknown as { CanvasGridLines: typeof CanvasGridLines }).CanvasGridLines = CanvasGridLines;

export default canvasGridLines;
