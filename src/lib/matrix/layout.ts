export function clampSplit(value: number, min = 20, max = 80): number {
	return Math.min(max, Math.max(min, value));
}
