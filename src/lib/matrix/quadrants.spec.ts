import { describe, it, expect } from 'vitest';
import { QUADRANTS, otherQuadrants } from './quadrants';

describe('otherQuadrants', () => {
	it('returns the three quadrants excluding the current one, in QUADRANTS order', () => {
		expect(otherQuadrants('q1')).toEqual(['q2', 'q3', 'q4']);
		expect(otherQuadrants('q3')).toEqual(['q1', 'q2', 'q4']);
	});

	it('never includes the current quadrant', () => {
		for (const q of QUADRANTS) {
			expect(otherQuadrants(q)).not.toContain(q);
		}
	});
});
