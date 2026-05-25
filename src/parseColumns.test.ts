import { describe, expect, it } from 'vitest';
import { applyColumns, parseColumns, validateColumns } from './parseColumns';

describe('parseColumns', () => {
    it('wraps a single number into a one-element array', () => {
        expect(parseColumns(12)).toEqual([12]);
    });

    it('parses a comma-separated string with whitespace tolerance', () => {
        expect(parseColumns('20, 2, 3')).toEqual([20, 2, 3]);
    });

    it('passes through a number array', () => {
        expect(parseColumns([20, 2, 3])).toEqual([20, 2, 3]);
    });

    it('rejects non-integer numeric inputs', () => {
        expect(() => parseColumns(2.5)).toThrow(/positive integer/);
        expect(() => parseColumns('2.5')).toThrow(/positive integer/);
        expect(() => parseColumns([1, 2.5, 3])).toThrow(/positive integer/);
    });

    it('rejects zero and negative values', () => {
        expect(() => parseColumns(0)).toThrow(/positive integer/);
        expect(() => parseColumns(-1)).toThrow(/positive integer/);
        expect(() => parseColumns('20,0,3')).toThrow(/positive integer/);
    });

    it('rejects non-numeric string segments', () => {
        expect(() => parseColumns('20,abc,3')).toThrow(/positive integer/);
        expect(() => parseColumns('')).toThrow(/positive integer/);
    });
});

describe('validateColumns', () => {
    it('accepts the exact length for each grid type', () => {
        expect(() => validateColumns([12], 'baseline')).not.toThrow();
        expect(() => validateColumns([12], 'squared')).not.toThrow();
        expect(() => validateColumns([20, 2, 3], 'columns')).not.toThrow();
        expect(() => validateColumns([20, 2, 3, 4, 5], 'rows')).not.toThrow();
    });

    it('throws with a helpful message on wrong length', () => {
        expect(() => validateColumns([20, 2], 'columns')).toThrow(/exactly 3.*total, gap1, gap2/);
        expect(() => validateColumns([20], 'rows')).toThrow(/exactly 5.*total, v_gap1, v_gap2, h_gap1, h_gap2/);
        expect(() => validateColumns([12, 3], 'baseline')).toThrow(/exactly 1.*total/);
    });
});

describe('applyColumns', () => {
    it('maps baseline / squared to null gap patterns', () => {
        const a = applyColumns(12, 'baseline');
        expect(a).toEqual({ columnsRaw: [12], columnsTotal: 12, hGaps: null, vGaps: null });

        const b = applyColumns(40, 'squared');
        expect(b).toEqual({ columnsRaw: [40], columnsTotal: 40, hGaps: null, vGaps: null });
    });

    it('maps columns to vertical gap pattern only', () => {
        const r = applyColumns([20, 2, 3], 'columns');
        expect(r).toEqual({
            columnsRaw: [20, 2, 3],
            columnsTotal: 20,
            hGaps: null,
            vGaps: [2, 3],
        });
    });

    it('maps rows with vertical gaps first, horizontal gaps second', () => {
        const r = applyColumns('30,4,5,5,6', 'rows');
        expect(r).toEqual({
            columnsRaw: [30, 4, 5, 5, 6],
            columnsTotal: 30,
            vGaps: [4, 5],
            hGaps: [5, 6],
        });
    });

    it('propagates parseColumns errors', () => {
        expect(() => applyColumns('20,abc,3', 'columns')).toThrow(/positive integer/);
    });

    it('propagates validateColumns errors', () => {
        expect(() => applyColumns(20, 'columns')).toThrow(/exactly 3/);
    });
});
