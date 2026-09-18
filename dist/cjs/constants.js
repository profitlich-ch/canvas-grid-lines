"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INIT_MARKER_ATTR = exports.ROW_SNAP_TOLERANCE = exports.DEFAULT_OBSERVE_RESIZE = exports.DEFAULT_TERMINATION = exports.DEFAULT_UNITS = exports.DEFAULT_COLOR = exports.DEFAULT_LINE_WIDTH = exports.DEFAULT_COLUMNS = exports.DEFAULT_GRID_TYPE = void 0;
exports.DEFAULT_GRID_TYPE = 'columns';
exports.DEFAULT_COLUMNS = '12';
exports.DEFAULT_LINE_WIDTH = 1;
exports.DEFAULT_COLOR = '#000000';
exports.DEFAULT_UNITS = 'layoutpixel';
exports.DEFAULT_TERMINATION = 'shorten';
exports.DEFAULT_OBSERVE_RESIZE = false;
/**
 * Largest distance from a whole grid row, in layout pixels, at which a
 * container's height still counts as that row. Absorbs sub-pixel layout
 * rounding without dropping or adding a row.
 */
exports.ROW_SNAP_TOLERANCE = 0.5;
/** Attribute set on the container once its grid has been initialised. CSS hook. */
exports.INIT_MARKER_ATTR = 'data-grid-initialised';
//# sourceMappingURL=constants.js.map