const GRID_TYPES = ['baseline', 'squared', 'columns', 'ribbons', 'rows'];
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
/**
 * Reads a boolean `data-*` attribute. A missing attribute yields `undefined`,
 * so the caller's default applies; `"false"` yields `false`; any other value,
 * including the bare attribute (`""`), yields `true`.
 */
export function parseBooleanAttribute(value) {
    if (value === null)
        return undefined;
    return value.trim().toLowerCase() !== 'false';
}
//# sourceMappingURL=types.js.map