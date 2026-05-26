const GRID_TYPES = ['baseline', 'squared', 'columns', 'rows'];
const UNITS = ['layoutpixel', 'devicepixel'];
const TERMINATIONS = ['shorten', 'fill', 'extend'];
export function isGridType(value) {
    return value != null && GRID_TYPES.includes(value);
}
export function isUnits(value) {
    return value != null && UNITS.includes(value);
}
export function isTermination(value) {
    return value != null && TERMINATIONS.includes(value);
}
//# sourceMappingURL=types.js.map