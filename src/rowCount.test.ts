import { describe, expect, it } from 'vitest';
import { snappedRows } from './rowCount';

// 26.23 px per row, as measured for a 59-column grid on a 1548px container.
const GRID_SIZE = 26.23;
const EXACT = 32 * GRID_SIZE;

describe('snappedRows', () => {
    it('snaps a height just short of a whole row up to it', () => {
        expect(snappedRows(EXACT - 0.3, GRID_SIZE, 0.5)).toBe(32);
    });

    it('snaps a height just past a whole row down to it', () => {
        expect(snappedRows(EXACT + 0.3, GRID_SIZE, 0.5)).toBe(32);
    });

    it('leaves a height outside the tolerance unsnapped', () => {
        expect(Math.floor(snappedRows(EXACT - 0.7, GRID_SIZE, 0.5))).toBe(31);
        expect(Math.ceil(snappedRows(EXACT + 0.7, GRID_SIZE, 0.5))).toBe(33);
    });

    it('measures the tolerance in pixels, not in rows', () => {
        // 0.3px is within 0.5px, although it is 0.3 rows on a 1px grid.
        expect(snappedRows(10.3, 1, 0.5)).toBe(10);
        expect(snappedRows(100 * 10 + 3, 10, 0.5)).toBe(100.3);
    });
});
