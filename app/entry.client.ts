"use client";
import "~/manifest.ts";
import "~/client/request.ts";

// deno-lint-ignore no-explicit-any
const g = globalThis as any;
g.htmx.config.methodsThatUseUrlParams = ['get'];

document.body.addEventListener('htmx:beforeOnLoad', function (e) {
	const evt = e as CustomEvent<{
		xhr: { status: number };
		shouldSwap: boolean;
		isError: boolean;
	}>;

	evt.detail.shouldSwap = true;
	evt.detail.isError = false;
});

// vite complains if the client entry doesn't have a default export
export default {};