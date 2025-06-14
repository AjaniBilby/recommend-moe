// deno-lint-ignore-file no-explicit-any
// Borrowed & modified from https://github.com/jenseng/abuse-the-platform/blob/main/app/utils/singleton.ts

export function Singleton<T>(name: string, cb: () => T): T {
	const g = globalThis as any;
	g.__singletons ??= {};
	g.__singletons[name] ??= cb();
	return g.__singletons[name];
}

export function ListSingletons() {
	const g = globalThis as any;
	g.__singletons ??= {};

	return Object.keys(g.__singletons);
}

export function ReplaceSingleton<Value>(name: string, replacement: Value): Value | undefined {
	const g = globalThis as unknown as { __singletons: Record<string, unknown> };
	g.__singletons ??= {};

	const existing = g.__singletons[name] as Value | undefined;
	g.__singletons[name] = replacement;

	return existing;
}