import type { GridType, Termination, Units } from './types';

export const DEFAULT_GRID_TYPE: GridType = 'columns';
export const DEFAULT_COLUMNS: string = '12';
export const DEFAULT_LINE_WIDTH: number = 1;
export const DEFAULT_COLOR: string = '#000000';
export const DEFAULT_UNITS: Units = 'layoutpixel';
export const DEFAULT_TERMINATION: Termination = 'shorten';
export const DEFAULT_OBSERVE_RESIZE: boolean = false;

/**
 * Largest distance from a whole grid row, in layout pixels, at which a
 * container's height still counts as that row. Absorbs sub-pixel layout
 * rounding without dropping or adding a row.
 */
export const ROW_SNAP_TOLERANCE: number = 0.5;

/** Attribute set on the container once its grid has been initialised. CSS hook. */
export const INIT_MARKER_ATTR: string = 'data-grid-initialised';
