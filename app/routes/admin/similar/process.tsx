import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { UpdateMediaStaleAffinity } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { prisma } from "~/db.server.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");
	return MakeStream(request, { render: renderToString, highWaterMark: 1000 }, Compute);
}



async function Compute(stream: StreamResponse<true>) {
	stream.send("this", "innerHTML", <>
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	let stale = await CountStale();
	let tally = 0;

	while (stale > 0) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${tally/stale*100}" max="100" />`);
		stream.send(".status", "innerText", `Analyzed ${tally} of ${stale}`);
		await prisma.$queryRawTyped(UpdateMediaStaleAffinity());

		tally += 100;
		if (tally >= stale) stale = await CountStale();
	}

	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="100" max="100" />`);
	stream.send(".status", "innerText", "done");

	stream.close();
}

function CountStale() {
	return prisma.mediaAffinity.count({ where: { stale: true } });
}