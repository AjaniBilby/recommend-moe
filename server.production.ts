import { createHtmxServer } from 'htmx-router/server.js';
import { renderToString } from 'react-dom/server';

import { ServeStatic, StaticResponse } from "~/server/static.ts";
import { CutString } from "~/util/format/text.ts";

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

		return "<!DOCTYPE html>" + renderToString(res);
	}
});


export default {
	async fetch (req) {
		{ // try static index lookup first
			const res = StaticResponse(req);
			if (res !== null) return await res;
		}

		// deno headers are immutable
		// const origin = req.headers.get("Cf-Connecting-IP");
		// if (origin) req.headers.set("X-Real-IP", origin);

		const start = Date.now();
		const res = await htmx.resolve(req, true);
		const end = Date.now();

		console.log(`${req.method} /${CutString(req.url, "/", 3)[1]} ${res.status} - ${end-start}ms`);

		return res;
	}
} satisfies Deno.ServeDefaultExport


// Deno.addSignalListener("SIGINT", shutdown);
// Deno.addSignalListener("SIGTERM", shutdown);
// Deno.addSignalListener("SIGHUP", shutdown);