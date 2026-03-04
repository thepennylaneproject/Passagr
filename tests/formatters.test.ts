import { formatProcessingRange, formatVerifiedDate, normalizeDocList } from '../src/lib/formatters';

describe('formatters', () => {
    describe('formatProcessingRange', () => {
        it('formats full ranges', () => {
            expect(formatProcessingRange(10, 20)).toBe('10 - 20 days');
        });

        it('formats min-only ranges', () => {
            expect(formatProcessingRange(10, null)).toBe('10+ days');
        });

        it('formats max-only ranges', () => {
            expect(formatProcessingRange(null, 20)).toBe('Up to 20 days');
        });

        it('returns null when range is missing', () => {
            expect(formatProcessingRange(null, null)).toBeNull();
        });
    });

    describe('formatVerifiedDate', () => {
        it('returns a fallback for missing or invalid dates', () => {
            expect(formatVerifiedDate(null)).toBe('Not verified');
            expect(formatVerifiedDate('not-a-date')).toBe('Not verified');
        });
    });

    describe('normalizeDocList', () => {
        it('handles arrays', () => {
            expect(normalizeDocList(['Passport'])).toEqual(['Passport']);
        });

        it('wraps strings into an array', () => {
            expect(normalizeDocList('Passport')).toEqual(['Passport']);
        });

        it('returns empty array for nullish values', () => {
            expect(normalizeDocList(null)).toEqual([]);
            expect(normalizeDocList(undefined)).toEqual([]);
        });
    });
});
