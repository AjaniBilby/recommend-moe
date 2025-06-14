import * as path from "node:path";
import { createRequestHandler } from 'htmx-router';
import { renderToString } from 'react-dom/server';

import { ServeStatic, StaticResponse } from "~/server/static.ts";
import { connectToWeb } from "./patch/connectToWeb.ts";

const isProduction = Deno.env.get("NODE_ENV") === "production";
const viteDevServer = isProduction
	? null
	: await import("vite").then((vite) =>
			vite.createServer({
				server: { middlewareMode: true },
				appType: 'custom'
			})
		);
const viteWrapper = viteDevServer ? connectToWeb(viteDevServer.middlewares) : undefined;

if (!viteDevServer) {
	ServeStatic("dist/server/dist/asset", "/dist/asset");
	ServeStatic("dist/client");
}

ServeStatic("public");


const build = viteDevServer
	? () => viteDevServer.ssrLoadModule("./app/entry.server.ts")
	: await import("./dist/server/entry.server.js");

const handler = createRequestHandler.native({
	build, viteDevServer,
	render: (res, headers) => {
		if (isProduction) headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		headers.set("Content-Type", "text/html; charset=UTF-8");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("X-Frame-Options", "SAMEORIGIN");

		return renderToString(res);
	}
});

export default {
	async fetch (req: Request) {
		{ // try static index lookup first
			const res = StaticResponse(req);
			if (res !== null) return await res;
		}

		if (viteWrapper) {
			const res = await viteWrapper(req);
			if (res) return res;
		}

		const res = await handler(req);
		return res.response;
	}
}


// Reload pages on file change
if (viteDevServer) {
	const focus = path.resolve("./app");
	viteDevServer.watcher.on('change', (file) => {
		if (!file.startsWith(focus)) return;
		console.info('Triggering full page reload');
		viteDevServer.ws.send({ type: 'full-reload' });
	});
}

// Deno.addSignalListener("SIGINT", shutdown);
// Deno.addSignalListener("SIGTERM", shutdown);
// Deno.addSignalListener("SIGHUP", shutdown);