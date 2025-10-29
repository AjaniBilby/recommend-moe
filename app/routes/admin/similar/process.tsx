import { MakeStream, StreamResponse } from "hx-stream/server";
import { UpdateMediaAffinity } from "@db/sql.ts";
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

const INTERVAL = 700;
async function Compute(stream: StreamResponse<true>) {
	stream.send("this", "innerHTML", <>
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	let updated = 0;
	let nextDraw = 0;
	await JobQueue({
		tasks: await prisma.media.findMany({
			select:  { id: true   },
			orderBy: { id: 'desc' }
		}),
		task: async (media) => {
			const total = await prisma.mediaAffinity.count({ where: { aID: media.id, stale: true } });
			if (total < 1) return;

			while (true) {
				await prisma.$queryRawTyped(UpdateMediaAffinity(media.id));

				const count = await prisma.mediaAffinity.count({ where: { aID: media.id, stale: true } });
				if (count < 1) break;
			}

			updated += total;
		},
		concurrency: 20,

		notify: (completed, total) => {
			const n = Date.now();
			if (n < nextDraw) return;

			stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${completed}" max="${total}" />`);
			stream.send(".status", "innerText", `Analyzed ${completed} of ${total} (${updated} updated)`);
			nextDraw = n + INTERVAL;
		}
	});

	stream.send(".status", "innerText", "done");
	stream.close();
}

function CountStale() {
	return prisma.mediaAffinity.count({ where: { stale: true } });
}
