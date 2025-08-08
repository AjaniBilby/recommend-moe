import * as path from "node:path";
import { createHtmxServer } from 'htmx-router/server';
import { renderToString } from 'react-dom/server';

import * as vite from "vite";
import { ServeStatic, StaticResponse } from "~/server/static.ts";

const viteDevServer = await vite.createServer({
	server: { middlewareMode: true },
	appType: 'custom'
});

if (!viteDevServer) {
	ServeStatic("build/server/dist/asset", "/build/asset");
	ServeStatic("build/client");
}

ServeStatic("public");


const build = () => viteDevServer.ssrLoadModule("./app/entry.server.ts") as any;

const headers = new Headers();
headers.set("Cache-Control", "no-store");

const htmx = createHtmxServer({
	build, viteDevServer: viteDevServer as any,
	render: renderToString, headers
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


// Reload pages on file change
const focus = path.resolve("./app");
viteDevServer.watcher.on('change', (file) => {
	if (!file.startsWith(focus)) return;
	console.info('Triggering full page reload');
	viteDevServer.ws.send({ type: 'full-reload' });
});