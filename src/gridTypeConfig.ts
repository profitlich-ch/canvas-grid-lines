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
    /**
     * Whether this grid type draws a horizontal line on the canvas edge (top/bottom).
     * Drives `marginY` — and `termination: 'extend'`, which only means something
     * when there is a horizontal line to close the bottom edge with.
     */
    hasHorizontalEdgeLine: boolean;
    /** Whether the path describes areas to fill rather than lines to stroke. */
    isFilled: boolean;
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
        isFilled: false,
        mapGaps: () => ({ hGaps: null, vGaps: null }),
    },
    squared: {
        columnsLength: 1,
        columnsShape: 'total',
        hasHorizontalEdgeLine: true,
        isFilled: false,
        mapGaps: () => ({ hGaps: null, vGaps: null }),
    },
    columns: {
        columnsLength: 3,
        columnsShape: 'total, gap1, gap2',
        hasHorizontalEdgeLine: false,
        isFilled: false,
        mapGaps: v => ({ hGaps: null, vGaps: [v[1], v[2]] }),
    },
    // Same edge sequence as `columns` — the difference is only what is done with
    // it: `columns` strokes the edges, `ribbons` fills the spans between them.
    ribbons: {
        columnsLength: 3,
        columnsShape: 'total, band, gap',
        hasHorizontalEdgeLine: false,
        isFilled: true,
        mapGaps: v => ({ hGaps: null, vGaps: [v[1], v[2]] }),
    },
    rows: {
        columnsLength: 5,
        columnsShape: 'total, v_gap1, v_gap2, h_gap1, h_gap2',
        hasHorizontalEdgeLine: true,
        isFilled: false,
        mapGaps: v => ({ vGaps: [v[1], v[2]], hGaps: [v[3], v[4]] }),
    },
};
