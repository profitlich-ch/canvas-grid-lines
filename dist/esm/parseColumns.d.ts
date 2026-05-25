import type { ColumnsInput, GridType } from './types';
import { type AppliedGaps } from './gridTypeConfig';
/**
 * Normalises any `columns` input shape to a positive-integer array.
 * Throws on any non-integer, non-positive or unparseable value.
 */
export declare function parseColumns(raw: ColumnsInput): number[];
/**
 * Verifies that the parsed array has the exact length the grid type requires.
 * Throws otherwise — there is no silent fallback.
 */
export declare function validateColumns(values: number[], gridType: GridType): void;
export interface AppliedColumns extends AppliedGaps {
    columnsTotal: number;
    columnsRaw: number[];
}
/**
 * Parses, validates and maps the raw `columns` input to the per-axis gap pattern
 * dictated by the grid type. Pure — no DOM access, no instance state.
 */
export declare function applyColumns(raw: ColumnsInput, gridType: GridType): AppliedColumns;
