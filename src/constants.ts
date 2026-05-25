import type { GridType, Units } from './types';

export const DEFAULT_GRID_TYPE: GridType = 'columns';
export const DEFAULT_COLUMNS: string = '12';
export const DEFAULT_LINE_WIDTH: number = 1;
export const DEFAULT_COLOR: string = '#000000';
export const DEFAULT_UNITS: Units = 'layoutpixel';
export const DEFAULT_EXTEND: boolean = true;

/** Attribute set on the container once its grid has been initialised. CSS hook. */
export const INIT_MARKER_ATTR: string = 'data-grid-initialised';
