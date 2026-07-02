export const QUADRANTS = ['q1', 'q2', 'q3', 'q4'] as const;
export type Quadrant = (typeof QUADRANTS)[number];

export const QUADRANT_META: Record<
	Quadrant,
	{ label: string; criteria: string; arrow: string; hue: number; opacity: number }
> = {
	q1: { label: 'Зробити зараз', criteria: 'терміново і важливо', arrow: '↖', hue: 25, opacity: 1 },
	q2: {
		label: 'Запланувати',
		criteria: 'важливо, не терміново',
		arrow: '↗',
		hue: 250,
		opacity: 0.95
	},
	q3: {
		label: 'Делегувати',
		criteria: 'терміново, не важливо',
		arrow: '↙',
		hue: 80,
		opacity: 0.85
	},
	q4: { label: 'Колись', criteria: 'не важливо, не терміново', arrow: '↘', hue: 260, opacity: 0.7 }
};

export function otherQuadrants(current: Quadrant): Quadrant[] {
	return QUADRANTS.filter((q) => q !== current);
}
