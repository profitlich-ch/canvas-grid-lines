import { describe, expect, it } from 'vitest';
import { gapPattern, nextGapTick } from './gapPattern';

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

describe('nextGapTick', () => {
    it('returns 0 for threshold 0', () => {
        expect(nextGapTick(0, [5, 1])).toBe(0);
    });

    it('returns the first non-zero tick when threshold is just above 0', () => {
        expect(nextGapTick(0.0001, [5, 1])).toBe(5);
        expect(nextGapTick(1, [5, 1])).toBe(5);
    });

    it('skips gap positions that the pattern never lands on', () => {
        // pattern [6,1] yields 0, 6, 7, 13, 14, 20, 21, … — 18 is not a tick
        expect(nextGapTick(18, [6, 1])).toBe(20);
        expect(nextGapTick(15, [6, 1])).toBe(20);
    });

    it('returns the threshold when it already is a tick', () => {
        expect(nextGapTick(14, [6, 1])).toBe(14);
        expect(nextGapTick(13, [6, 1])).toBe(13);
    });

    it('handles symmetric gaps', () => {
        expect(nextGapTick(5, [2, 2])).toBe(6);
        expect(nextGapTick(6, [2, 2])).toBe(6);
    });
});
