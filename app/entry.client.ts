import Client from "./manifest.tsx";
import "~/client/request.ts";

// deno-lint-ignore no-explicit-any
const g = globalThis as any;
g.htmx.config.methodsThatUseUrlParams = ['get'];
// g.htmx.config.globalViewTransitions = true;

document.body.addEventListener('htmx:beforeOnLoad', function (e) {
	const evt = e as CustomEvent<{
		xhr: { status: number };
		shouldSwap: boolean;
		isError: boolean;
	}>;

	evt.detail.shouldSwap = true;
	evt.detail.isError = false;
});

console.log("linked", Object.keys(Client));

// vite complains if the client entry doesn't have a default export
export default {};