import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { RankNoveltyInit } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { prisma } from "~/db.server.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");
	return MakeStream(request, { render: renderToString, highWaterMark: 1000 }, Compute);
}


const scale = 1/1000;
async function Compute(stream: StreamResponse<true>) {
	await prisma.mediaRanking.deleteMany(); // clear any old values

	stream.send("this", "innerHTML", <>
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	const start = Date.now();
	let tally = 0;

	const total = await prisma.media.count();
	let i = await prisma.mediaRanking.count();
	while (i < total) {
		if (stream.readyState === StreamResponse.CLOSED) return;

		if (i > 0) {
			const rem = total - i;
			const time = (Date.now() - start) / tally * rem;
			stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${i/total*100}" max="100" />`);
			stream.send(".status", "innerText", `eta: ${(time*scale).toFixed(2)} sec`);
		}
		await prisma.$queryRawTyped(RankNoveltyInit());

		const next = await prisma.mediaRanking.count();
		tally += next-i;
		i = next;
	}

	// remove any media with no connections
	await prisma.mediaRanking.deleteMany({ where: { width: 0 } });

	const time = (Date.now() - start);
	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${i/total*100}" max="100" />`);
	stream.send(".status", "innerText", `Done! Taking ${(time*scale).toFixed(2)} sec`);
	stream.close();
}