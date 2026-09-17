/**
 * Returns a function that queues items and hands each of them to `run` once,
 * on the next frame requested through `requestFrame`. Queuing an item that is
 * already waiting has no effect, so a burst of notifications for the same item
 * within one frame costs a single run.
 *
 * The queue is emptied before the items run: an item queued again while
 * `run` is executing waits for the following frame instead of being lost.
 */
export function createFrameBatch(requestFrame, run) {
    const queued = new Set();
    return (item) => {
        if (queued.size === 0) {
            requestFrame(() => {
                const items = Array.from(queued);
                queued.clear();
                items.forEach(run);
            });
        }
        queued.add(item);
    };
}
//# sourceMappingURL=frameBatch.js.map