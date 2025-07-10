export function SafeInteger(value: number, fallback: number) {
	if (!Number.isSafeInteger(value)) return fallback;
	return value;
}

export function SafeQueryInteger(url: URLSearchParams, key: string, fallback: number) {
	if (!url.has(key)) return fallback;
	return SafeInteger(Number(url.get(key) || ""), fallback);
}