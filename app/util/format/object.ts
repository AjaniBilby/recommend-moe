export function ShapeArray<T extends string[]>(shape: T, data: string[]): Record<T[number], string> {
	return Object.fromEntries(shape.map((x, i) => [x, data[i] || ""])) as Record<T[number], string>;
}