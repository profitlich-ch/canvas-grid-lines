import { describe, expect, it } from 'vitest';
import { createFrameBatch } from './frameBatch';

/** Manual frame clock: callbacks run only when `tick()` is called. */
function fakeFrames() {
    let pending: Array<() => void> = [];
    return {
        requestFrame: (callback: () => void) => { pending.push(callback); },
        tick: () => {
            const callbacks = pending;
            pending = [];
            callbacks.forEach(callback => callback());
        },
        get requested() { return pending.length; },
    };
}

describe('createFrameBatch', () => {
    it('runs nothing before the frame', () => {
        const frames = fakeFrames();
        const ran: string[] = [];
        const queue = createFrameBatch<string>(frames.requestFrame, item => ran.push(item));

        queue('a');

        expect(ran).toEqual([]);
    });

    it('runs each queued item once per frame, however often it was queued', () => {
        const frames = fakeFrames();
        const ran: string[] = [];
        const queue = createFrameBatch<string>(frames.requestFrame, item => ran.push(item));

        queue('a');
        queue('b');
        queue('a');
        queue('a');
        frames.tick();

        expect(ran).toEqual(['a', 'b']);
    });

    it('requests a single frame for a burst of items', () => {
        const frames = fakeFrames();
        const queue = createFrameBatch<string>(frames.requestFrame, () => {});

        queue('a');
        queue('b');
        queue('c');

        expect(frames.requested).toBe(1);
    });

    it('requests a new frame once the previous one has run', () => {
        const frames = fakeFrames();
        const ran: string[] = [];
        const queue = createFrameBatch<string>(frames.requestFrame, item => ran.push(item));

        queue('a');
        frames.tick();
        queue('a');
        frames.tick();

        expect(ran).toEqual(['a', 'a']);
    });

    it('defers an item queued during a run to the following frame', () => {
        const frames = fakeFrames();
        const ran: string[] = [];
        let requeued = false;
        const queue = createFrameBatch<string>(frames.requestFrame, item => {
            ran.push(item);
            if (!requeued) {
                requeued = true;
                queue(item);
            }
        });

        queue('a');
        frames.tick();
        expect(ran).toEqual(['a']);

        frames.tick();
        expect(ran).toEqual(['a', 'a']);
    });
});
