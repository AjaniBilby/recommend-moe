
import { MakeStream, StreamResponse } from "hx-stream/server";
import { FillMediaAffinityLH } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { JobQueue } from "~/util/schedule.ts";
import { prisma } from "~/db.server.ts";


export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	return MakeStream({ render: renderToString, highWaterMark: 1000, abortSignal: request.signal }, Compute);
}

const INTERVAL = 200;
async function Compute(stream: StreamResponse<true>) {
	stream.send("this", "innerHTML", <>
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	let nextDraw = 0;
	await JobQueue({
		tasks: await prisma.media.findMany({
			select:  { id: true   },
			orderBy: { id: 'desc' }
		}),
		task: async (media) => {
			await prisma.$queryRawTyped(FillMediaAffinityLH(media.id));
			return;
		},
		concurrency: 20,

		notify: (completed, total) => {
			const n = Date.now();
			if (n < nextDraw) return;

			stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${completed}" max="${total}" />`);
			nextDraw = n + INTERVAL;
		}
	});

	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="100" max="100" />`);
	stream.send(".status", "innerText", "done");

	stream.close();
}
