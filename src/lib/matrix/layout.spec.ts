import { describe, it, expect } from 'vitest';
import { clampSplit } from './layout';

describe('clampSplit', () => {
	it('clamps values below the minimum', () => {
		expect(clampSplit(5)).toBe(20);
	});

	it('clamps values above the maximum', () => {
		expect(clampSplit(95)).toBe(80);
	});

	it('passes through in-range values unchanged', () => {
		expect(clampSplit(50)).toBe(50);
	});

	it('respects custom bounds', () => {
		expect(clampSplit(10, 15, 90)).toBe(15);
		expect(clampSplit(95, 15, 90)).toBe(90);
	});
});
