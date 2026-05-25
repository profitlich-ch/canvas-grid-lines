"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseColumns = parseColumns;
exports.validateColumns = validateColumns;
exports.applyColumns = applyColumns;
const gridTypeConfig_1 = require("./gridTypeConfig");
/**
 * Normalises any `columns` input shape to a positive-integer array.
 * Throws on any non-integer, non-positive or unparseable value.
 */
function parseColumns(raw) {
    if (typeof raw === 'number') {
        return [assertPositiveInteger(raw, String(raw))];
    }
    if (typeof raw === 'string') {
        return raw.split(',').map(s => {
            const trimmed = s.trim();
            return assertPositiveInteger(Number(trimmed), trimmed);
        });
    }
    if (Array.isArray(raw)) {
        return raw.map(n => assertPositiveInteger(n, String(n)));
    }
    throw new Error('columns must be a number, comma-separated string, or number array');
}
/**
 * Verifies that the parsed array has the exact length the grid type requires.
 * Throws otherwise — there is no silent fallback.
 */
function validateColumns(values, gridType) {
    const config = gridTypeConfig_1.GRID_TYPE_CONFIG[gridType];
    if (values.length !== config.columnsLength) {
        const plural = config.columnsLength > 1 ? 's' : '';
        throw new Error(`gridType "${gridType}" requires exactly ${config.columnsLength} columns value${plural} (${config.columnsShape})`);
    }
}
/**
 * Parses, validates and maps the raw `columns` input to the per-axis gap pattern
 * dictated by the grid type. Pure — no DOM access, no instance state.
 */
function applyColumns(raw, gridType) {
    const values = parseColumns(raw);
    validateColumns(values, gridType);
    const { hGaps, vGaps } = gridTypeConfig_1.GRID_TYPE_CONFIG[gridType].mapGaps(values);
    return {
        columnsRaw: values,
        columnsTotal: values[0],
        hGaps,
        vGaps,
    };
}
function assertPositiveInteger(n, label) {
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid columns value "${label}": must be a positive integer`);
    }
    return n;
}
//# sourceMappingURL=parseColumns.js.map