export function SafeInteger(value: number, fallback: number) {
	if (!Number.isSafeInteger(value)) return fallback;
	return value;
}

export function SafeQueryInteger(url: URLSearchParams, key: string, fallback: number) {
	if (!url.has(key)) return fallback;
	return SafeInteger(Number(url.get(key) || ""), fallback);
}


export function Float32ArrayDot(a: Float32Array, b: Float32Array) {
	if (a.length !== b.length) throw new Error("Arrays must have the same length for dot product");

	let sum = 0;
	for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
	return sum;
}