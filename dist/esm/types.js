const GRID_TYPES = ['baseline', 'squared', 'columns', 'rows'];
const UNITS = ['layoutpixel', 'devicepixel'];
export function isGridType(value) {
    return value != null && GRID_TYPES.includes(value);
}
export function isUnits(value) {
    return value != null && UNITS.includes(value);
}
//# sourceMappingURL=types.js.map