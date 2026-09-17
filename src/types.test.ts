import { describe, expect, it } from 'vitest';
import { parseBooleanAttribute } from './types';

describe('parseBooleanAttribute', () => {
    it('returns undefined for a missing attribute, so the default applies', () => {
        expect(parseBooleanAttribute(null)).toBeUndefined();
    });

    it('treats the bare attribute as true', () => {
        expect(parseBooleanAttribute('')).toBe(true);
    });

    it('reads "true" as true', () => {
        expect(parseBooleanAttribute('true')).toBe(true);
    });

    it('reads "false" as false, regardless of case and surrounding space', () => {
        expect(parseBooleanAttribute('false')).toBe(false);
        expect(parseBooleanAttribute(' FALSE ')).toBe(false);
    });
});
