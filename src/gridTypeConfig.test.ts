import { describe, expect, it } from 'vitest';
import { GRID_TYPE_CONFIG } from './gridTypeConfig';
import type { GridType } from './types';

const ALL_GRID_TYPES: GridType[] = ['baseline', 'squared', 'columns', 'rows'];

describe('GRID_TYPE_CONFIG', () => {
    it('defines a config entry for every grid type', () => {
        for (const t of ALL_GRID_TYPES) {
            expect(GRID_TYPE_CONFIG[t]).toBeDefined();
        }
    });

    it('mapGaps accepts an array of the declared columnsLength', () => {
        for (const t of ALL_GRID_TYPES) {
            const cfg = GRID_TYPE_CONFIG[t];
            const dummy = Array.from({ length: cfg.columnsLength }, (_, i) => i + 1);
            expect(() => cfg.mapGaps(dummy)).not.toThrow();
            const result = cfg.mapGaps(dummy);
            expect(result).toHaveProperty('hGaps');
            expect(result).toHaveProperty('vGaps');
        }
    });

    it('baseline and squared expose no gap patterns', () => {
        expect(GRID_TYPE_CONFIG.baseline.mapGaps([12])).toEqual({ hGaps: null, vGaps: null });
        expect(GRID_TYPE_CONFIG.squared.mapGaps([12])).toEqual({ hGaps: null, vGaps: null });
    });

    it('columns maps to vertical gaps only', () => {
        expect(GRID_TYPE_CONFIG.columns.mapGaps([20, 2, 3])).toEqual({ hGaps: null, vGaps: [2, 3] });
    });

    it('rows maps vertical gaps before horizontal gaps', () => {
        expect(GRID_TYPE_CONFIG.rows.mapGaps([30, 4, 5, 5, 6])).toEqual({ vGaps: [4, 5], hGaps: [5, 6] });
    });

    it('hasHorizontalEdgeLine matches marginY behaviour: only types with a top/bottom line', () => {
        expect(GRID_TYPE_CONFIG.baseline.hasHorizontalEdgeLine).toBe(true);
        expect(GRID_TYPE_CONFIG.squared.hasHorizontalEdgeLine).toBe(true);
        expect(GRID_TYPE_CONFIG.rows.hasHorizontalEdgeLine).toBe(true);
        expect(GRID_TYPE_CONFIG.columns.hasHorizontalEdgeLine).toBe(false);
    });
});
