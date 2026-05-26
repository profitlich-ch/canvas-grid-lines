"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGridType = isGridType;
exports.isUnits = isUnits;
exports.isTermination = isTermination;
const GRID_TYPES = ['baseline', 'squared', 'columns', 'rows'];
const UNITS = ['layoutpixel', 'devicepixel'];
const TERMINATIONS = ['shorten', 'fill', 'extend'];
function isGridType(value) {
    return value != null && GRID_TYPES.includes(value);
}
function isUnits(value) {
    return value != null && UNITS.includes(value);
}
function isTermination(value) {
    return value != null && TERMINATIONS.includes(value);
}
//# sourceMappingURL=types.js.map