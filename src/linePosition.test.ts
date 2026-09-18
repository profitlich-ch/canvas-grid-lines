import { describe, expect, it } from 'vitest';
import { linePosition } from './linePosition';

describe('linePosition', () => {
    it('keeps the half line width on the first line', () => {
        expect(linePosition(0, 34.39, 0.5)).toBe(0.5);
    });

    it('centres an odd-width line on a pixel, not on a pixel boundary', () => {
        expect(linePosition(1, 34.39, 0.5)).toBe(34.5);
        expect(linePosition(3, 34.39, 0.5)).toBe(103.5);
    });

    it('centres an even-width line on a pixel boundary', () => {
        expect(linePosition(3, 34.39, 1)).toBe(104);
    });
});
