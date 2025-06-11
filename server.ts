import * as path from "node:path";
import { createRequestHandler } from 'htmx-router';
import { renderToString } from 'react-dom/server';

import { ServeStatic, StaticResponse } from "~/server/static.ts";

const port = Number(process.env.PORT) || 3000;

const isProduction = process.env.NODE_ENV === "production";
const viteDevServer = isProduction
	? null
	: await import("vite").then((vite) =>
			vite.createServer({
				server: { middlewareMode: true },
				appType: 'custom'
			})
		);

if (viteDevServer) {
	// app.use(viteDevServer.middlewares)
} else {
	ServeStatic("dist/server/dist/asset", "/dist/asset");
	ServeStatic("dist/client");
}

ServeStatic("public");

// logging
// app.use(morgan("tiny"));

const build = viteDevServer
	? () => viteDevServer.ssrLoadModule('./app/entry.server.ts')
	: await import('./dist/server/entry.server.js');

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

const server = Deno.serve({ port }, async (req: Request) => {
	{ // try static index lookup first
		const res = StaticResponse(req);
		if (res !== null) return await res;
	}

	const res = await handler(req);
	return res.response;
});


// Reload pages on file change
if (viteDevServer) {
	const focus = path.resolve("./app");
	viteDevServer.watcher.on('change', (file) => {
		if (!file.startsWith(focus)) return;
		console.info('Triggering full page reload');
		viteDevServer.ws.send({ type: 'full-reload' });
	});
}

const shutdown = () => {
	console.info("Shutting down server...");

	// Close the server gracefully
	// server.close((err) => {
	// 	if (err) {
	// 		console.error("Error during server shutdown:", err);
	// 		process.exit(1);
	// 	}
	// 	console.info("Server shut down gracefully.");
	// 	process.exit(0);
	// });
	server.shutdown();
};

// Deno.addSignalListener("SIGINT", shutdown);
// Deno.addSignalListener("SIGTERM", shutdown);
// Deno.addSignalListener("SIGHUP", shutdown);


// Handle uncaught exceptions
globalThis.addEventListener("error", (event) => {
	console.error(event.error, "Uncaught Exception thrown");
	event.preventDefault(); // Prevent Deno from printing its default error
	Deno.exit(1);
});

// Handle unhandled promise rejections
globalThis.addEventListener("unhandledrejection", (event) => {
	console.error(
		event.reason,
		"Unhandled Rejection at Promise",
		event.promise,
	);
	event.preventDefault();
});