import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { RankNoveltyChunk, RankNoveltyStep } from "db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";
import { ReactNode } from "react";

import { prisma } from "~/db.server.ts";

import { shell } from "~/routes/$.tsx";

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

	const media = await prisma.mediaRanking.findMany({
		select: { id: true },
		where: { next: null }
	});

	const batchSize = 20;
	const start = Date.now();
	for (let i=0; i<media.length; i+=batchSize) {
		const queue = [];
		const limit = Math.min(i + batchSize, media.length);
		for (let j=i; j<limit; j++) queue.push(prisma.$queryRawTyped(RankNoveltyChunk(media[j].id)));

		await Promise.all(queue);

		if (stream.readyState === StreamResponse.CLOSED) return;
		{
			const time = (Date.now() - start) / i * (media.length - i);
			stream.send("this", "innerHTML", <ComputeMessage>Calculating {i} of {media.length} (eta: {(time*scale).toFixed(2)} sec)</ComputeMessage>);
		}
	}

	await prisma.$queryRawTyped(RankNoveltyStep());

	stream.send("this", "outerHTML", <ComputeMessage>Done</ComputeMessage>);
	stream.close();
}


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}