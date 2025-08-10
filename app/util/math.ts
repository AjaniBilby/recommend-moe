export function Truncate(x: number, digits: number = 1) {
	if (digits < 1) return Math.trunc(x);

	const m = 10 ** digits;
	return Math.trunc(x * m) / m;
}


export function SafeInteger(value: number, fallback: number) {
	if (!Number.isSafeInteger(value)) return fallback;
	return value;
}

export function SafeQueryInteger(url: URLSearchParams, key: string, fallback: number) {
	if (!url.has(key)) return fallback;
	return SafeInteger(Number(url.get(key) || ""), fallback);
}

export function AlignUpInteger(x: number, multiple: number) {
	if (multiple === 0) return x;

	const remainder = x % multiple;
	return remainder !== 0
		? x + (multiple - remainder)
		: x;
}

export function AlignDownInteger(x: number, multiple: number) {
	if (multiple === 0) return x;

	const remainder = x % multiple;
	return remainder !== 0
		? x - remainder
		: x;
}


export function Float32ArrayDot(a: Float32Array | number[], b: Float32Array | number[]) {
	if (a.length !== b.length) throw new Error("Arrays must have the same length for dot product");

	let sum = 0;
	for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
	return sum;
}

export function Lerp(a: number, b: number, p: number) {
	return (b-a)*p + a;
}



/**
 * Both sets must include no duplicates and be sorted in the same order
 */
export function IsSortedSuperSet<T> (sup: T[], base: T[]): boolean {
	let i = 0; let j = 0;
	while (i < sup.length && j < base.length) {
		if (sup[i] == base[j]) {
			i++; j++;
			continue;
		}

		i++;
	}

	return j >= base.length;
}

/**
 * The permission arrays must be sorted, and not include duplicates
 */
export function CompareSortedSets<T>(a: T[], b: T[]): 1 | 0 | -1 | null {
	const A = IsSortedSuperSet<T>(a, b);
	const B = IsSortedSuperSet<T>(b, a);

	const idx = Number(A) | (Number(B) << 1);
	return COMPARE_SETS_LOOKUP[idx] || null;
}
const COMPARE_SETS_LOOKUP = [
	null, // !A && !B
	1,    //  A && !B
	-1,   // !A &&  B
	0,    //  A &&  B
] as const;


export class QuickHash {
	public hash: number;

	constructor () {
		this.hash = 0;
	}

	push (val: number) {
		this.hash = (this.hash << 5) - this.hash + val;
		this.hash |= 0; // Convert to 32-bit integer
	}

	string (str: string) {
		for (let i = 0; i < str.length; i++) this.push(str.charCodeAt(i));
	}

	result () { return this.hash; }

	static string(str: string) {
		const t = new QuickHash();
		t.string(str);
		return t.result();
	}
}

export class Hash72 extends QuickHash {
	override push (val: number) {
		this.hash = (this.hash + val) % 1296
	}
}