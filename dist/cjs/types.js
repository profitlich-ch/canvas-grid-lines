"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGridType = isGridType;
exports.isUnits = isUnits;
const GRID_TYPES = ['baseline', 'squared', 'columns', 'rows'];
const UNITS = ['layoutpixel', 'devicepixel'];
function isGridType(value) {
    return value != null && GRID_TYPES.includes(value);
}
function isUnits(value) {
    return value != null && UNITS.includes(value);
}
//# sourceMappingURL=types.js.map