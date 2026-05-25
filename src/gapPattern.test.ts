import { describe, expect, it } from 'vitest';
import { gapPattern } from './gapPattern';

function collect(max: number, gaps: [number, number]): number[] {
    return Array.from(gapPattern(max, gaps));
}

describe('gapPattern', () => {
    it('starts at 0 and alternates the two gaps', () => {
        expect(collect(12, [2, 3])).toEqual([0, 2, 5, 7, 10, 12]);
    });

    it('stops as soon as the next position exceeds max', () => {
        // 0, 2, 5, 7 — next would be 10 which equals max, so it is included; then 12 > 11 stops it
        expect(collect(11, [2, 3])).toEqual([0, 2, 5, 7, 10]);
    });

    it('handles symmetric gaps', () => {
        expect(collect(10, [2, 2])).toEqual([0, 2, 4, 6, 8, 10]);
    });

    it('handles a gap of 1 mixed with a larger gap', () => {
        expect(collect(10, [1, 4])).toEqual([0, 1, 5, 6, 10]);
    });

    it('yields just 0 when max is 0', () => {
        expect(collect(0, [2, 3])).toEqual([0]);
    });
});
