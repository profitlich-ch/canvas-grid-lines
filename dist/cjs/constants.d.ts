import type { GridType, Termination, Units } from './types';
export declare const DEFAULT_GRID_TYPE: GridType;
export declare const DEFAULT_COLUMNS: string;
export declare const DEFAULT_LINE_WIDTH: number;
export declare const DEFAULT_COLOR: string;
export declare const DEFAULT_UNITS: Units;
export declare const DEFAULT_TERMINATION: Termination;
export declare const DEFAULT_OBSERVE_RESIZE: boolean;
/**
 * Largest distance from a whole grid row, in layout pixels, at which a
 * container's height still counts as that row. Absorbs sub-pixel layout
 * rounding without dropping or adding a row.
 */
export declare const ROW_SNAP_TOLERANCE: number;
/** Attribute set on the container once its grid has been initialised. CSS hook. */
export declare const INIT_MARKER_ATTR: string;
