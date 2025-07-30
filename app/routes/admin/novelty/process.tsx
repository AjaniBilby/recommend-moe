import { RankNoveltyChunk, RankNoveltyStep, GetRankStatistics } from "@db/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/dist/server";
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
		<div className="iteration">
			<progress style={{ width: "100%" }} max={5}></progress>
		</div>
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	let stats = await GetStats();
	const batchSize = 20;

	stream.send(".iteration", "innerHTML", `<progress style="width: 100%" value="${stats.iteration}" max="20" />`);

	while (stats.iteration < 20) {
		const media = await prisma.mediaRanking.findMany({
			select: { id: true },
			where:  { next: null }
		});

		for (let i=0; i<media.length; i+=batchSize) {
			const queue = [];
			const limit = Math.min(i + batchSize, media.length);
			for (let j=i; j<limit; j++) queue.push(prisma.$queryRawTyped(RankNoveltyChunk(media[j].id)));

			await Promise.all(queue);

			if (stream.readyState === StreamResponse.CLOSED) return;

			stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${i/media.length*100}" max="100" />`);
		}

		const delta = await prisma.$queryRaw<[{ sum: number }]>`
			SELECT SUM(ABS("next" - "weight")) FROM "MediaRanking" WHERE "next" is not null
		`;
		console.log(stats.iteration, delta[0].sum);

		await prisma.$queryRawTyped(RankNoveltyStep());
		stats = await GetStats();

		stream.send(".iteration", "innerHTML", `<progress style="width: 100%" value="${stats.iteration}" max="5" />`);
		stream.send(".status", "innerHTML",
			`min: ${stats.min.toFixed(3)} `
			+ `max: ${stats.max.toFixed(3)} `
			+ `range: ${stats.range} `
			+ `change: ${delta[0]?.sum}`
		);
	}

	stream.close();
}

async function GetStats() {
	const stats = (await prisma.$queryRawTyped(GetRankStatistics()))[0];
	return {
		min: stats.min || 0,
		max: stats.max || 1,
		range: stats.range || 0,
		iteration: stats.iteration || 0
	};
}