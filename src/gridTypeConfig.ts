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
export const GRID_TYPE_CONFIG: Record<GridType, GridTypeConfig> = {
    baseline: {
        columnsLength: 1,
        columnsShape: 'total',
        hasHorizontalEdgeLine: true,
        mapGaps: () => ({ hGaps: null, vGaps: null }),
    },
    squared: {
        columnsLength: 1,
        columnsShape: 'total',
        hasHorizontalEdgeLine: true,
        mapGaps: () => ({ hGaps: null, vGaps: null }),
    },
    columns: {
        columnsLength: 3,
        columnsShape: 'total, gap1, gap2',
        hasHorizontalEdgeLine: false,
        mapGaps: v => ({ hGaps: null, vGaps: [v[1], v[2]] }),
    },
    rows: {
        columnsLength: 5,
        columnsShape: 'total, v_gap1, v_gap2, h_gap1, h_gap2',
        hasHorizontalEdgeLine: true,
        mapGaps: v => ({ vGaps: [v[1], v[2]], hGaps: [v[3], v[4]] }),
    },
};
