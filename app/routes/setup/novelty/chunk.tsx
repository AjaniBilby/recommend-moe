import { RankNoveltyChunk, RankNoveltyStep, GetRankStatistics } from "db/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";
import { ReactNode } from "react";

import { prisma } from "~/db.server.ts";

import { shell } from "~/routes/$.tsx";
import { stat } from "node:fs";

export function loader() {
	return shell(<div hx-ext="hx-stream">
		<form method="POST"
			hx-post=""
			hx-stream="on"
			hx-trigger="submit"
			hx-target="#output"
		>
			<button type="submit">Compute</button>
		</form>

		<div id="output"></div>

	</div>, {});
}


export function action({ request, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	return MakeStream(request, { render: renderToString, highWaterMark: 1000 }, Compute);
}


const scale = 1/1000;
async function Compute(stream: StreamResponse<true>) {

	let stats = await GetStats();
	const batchSize = 20;

	while (stats.range < 0.01) {
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
			stream.send("this", "innerHTML", <ComputeMessage>
				{stats.iteration}: Calculating {i} of {media.length} (spread: {stats.range})
			</ComputeMessage>);
		}

		await prisma.$queryRawTyped(RankNoveltyStep());
		stats = await GetStats();
	}


	stream.send("this", "outerHTML", <ComputeMessage>Done</ComputeMessage>);
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


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card text-mono" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}