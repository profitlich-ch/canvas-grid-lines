export const DEFAULT_GRID_TYPE = 'columns';
export const DEFAULT_COLUMNS = '12';
export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_UNITS = 'layoutpixel';
export const DEFAULT_TERMINATION = 'shorten';
export const DEFAULT_OBSERVE_RESIZE = false;
/**
 * Largest distance from a whole grid row, in layout pixels, at which a
 * container's height still counts as that row. Absorbs sub-pixel layout
 * rounding without dropping or adding a row.
 */
export const ROW_SNAP_TOLERANCE = 0.5;
/** Attribute set on the container once its grid has been initialised. CSS hook. */
export const INIT_MARKER_ATTR = 'data-grid-initialised';
//# sourceMappingURL=constants.js.map