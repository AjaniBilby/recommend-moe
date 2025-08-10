import { MakeStream, StreamResponse } from "hx-stream/server";
import { UpdateMediaStaleAffinity } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { prisma } from "~/db.server.ts";
import { Lerp } from "~/util/math.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");
	return MakeStream({ render: renderToString, highWaterMark: 1000, abortSignal: request.signal }, Compute);
}

async function Compute(stream: StreamResponse<true>) {
	stream.send("this", "innerHTML", <>
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	let batchSize = 100;
	let stale = await CountStale();
	let tally = 0;

	while (true) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${tally/stale*100}" max="100" />`);
		stream.send(".status", "innerText", `Analyzed ${tally} of ${stale} (batch size: ${batchSize})`);

		const s = Date.now();
		await prisma.$queryRawTyped(UpdateMediaStaleAffinity(batchSize));
		const e = Date.now();
		tally += batchSize;

		const took = e-s;

		// optimize the batch size for 700ms iterations
		const next = 700 * (batchSize/took);
		batchSize = Math.floor(Lerp(batchSize, next, 0.1));
		if (batchSize < 10) batchSize = 10;

		if (tally >= stale) {
			const delta = await CountStale();
			if (delta < 1) break;
			stale += delta;
		}
	}

	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="100" max="100" />`);
	stream.send(".status", "innerText", "done");

	stream.close();
}

function CountStale() {
	return prisma.mediaAffinity.count({ where: { stale: true } });
}