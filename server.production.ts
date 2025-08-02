import { createHtmxServer } from 'htmx-router/server.js';
import { renderToString } from 'react-dom/server';

import { ServeStatic, StaticResponse } from "~/server/static.ts";

process.env.NODE_ENV = "production";

ServeStatic("dist/server/dist/asset", "/dist/asset/");
ServeStatic("dist/client");
ServeStatic("public");


const build = await import("./dist/server/entry.server.js") as any;

const htmx = createHtmxServer({
	build, viteDevServer: null,
	render: (res, headers) => {
		headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		headers.set("Content-Type", "text/html; charset=UTF-8");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("X-Frame-Options", "SAMEORIGIN");

		return renderToString(res);
	}
});


export default {
	async fetch (req) {
		{ // try static index lookup first
			const res = StaticResponse(req);
			if (res !== null) return await res;
		}

		const res = await htmx.resolve(req, true);
		return res;
	}
} satisfies Deno.ServeDefaultExport


// Deno.addSignalListener("SIGINT", shutdown);
// Deno.addSignalListener("SIGTERM", shutdown);
// Deno.addSignalListener("SIGHUP", shutdown);