import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { RouteContext } from "htmx-router";

import { shell } from "~/routes/$.tsx";

import { renderToString } from "react-dom/server";
import { Timeout } from "~/util/schedule.ts";
import { prisma } from "~/db.server.ts";

export function loader() {
	let timer: number | undefined = undefined;
	const body = new ReadableStream({
		start(controller) {
			timer = setInterval(() => {
				const message = `It is ${new Date().toISOString()}\n`;
				controller.enqueue(new TextEncoder().encode(message));
			}, 1000);
		},
		cancel() {
			if (timer !== undefined) {
				clearInterval(timer);
			}
		},
	}, { highWaterMark: 0 });
	return new Response(body, {
		headers: {
			"content-type": "text/plain",
			"x-content-type-options": "nosniff",
		},
	});
}