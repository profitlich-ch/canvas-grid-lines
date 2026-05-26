import type { GridType } from './types';
export interface AppliedGaps {
    hGaps: [number, number] | null;
    vGaps: [number, number] | null;
}
export interface GridTypeConfig {
    /** Exact number of values the `columns` input must carry for this grid type. */
    columnsLength: number;
    /** Human-readable shape used in validation error messages. */
    columnsShape: string;
    /** Whether this grid type draws a horizontal line on the canvas edge (top/bottom). Drives `marginY`. */
    hasHorizontalEdgeLine: boolean;
    /** Maps a validated `columns` array to the per-axis gap patterns. */
    mapGaps(values: number[]): AppliedGaps;
}
/**
 * Single source of truth for grid-type specific behaviour. Add a new grid type
 * here and the constructor, validator and renderer pick it up automatically.
 */
export declare const GRID_TYPE_CONFIG: Record<GridType, GridTypeConfig>;
