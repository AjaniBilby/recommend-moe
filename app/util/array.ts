// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SegmentArray<T, U extends T>(arr: Array<T>, split: U): Array<Array<Exclude<T, U>>> {
	const out: Array<Array<Exclude<T, U>>> = [[]];

	for (const v of arr) {
		if (v === split) out.push([]);
		else out[out.length-1].push(v as Exclude<T, U>);
	}

	return out;
}
