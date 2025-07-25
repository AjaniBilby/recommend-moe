import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { RankNoveltyInit, UpdateUserMediaAffinity } from "@db/sql.ts";
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
	const start = Date.now();

	const media = await prisma.media.findMany({
		select:  { id: true, title: true },
		orderBy: { id: "asc" }
	});

	for (let i=0; i<media.length; i++) {
		if (stream.readyState === StreamResponse.CLOSED) return;

		const p = i / media.length;
		if (p > 0) {
			const time = (Date.now() - start) / p;
			stream.send("this", "innerHTML", <ComputeMessage>
				<div>Calculating {i} of {media.length} (eta: {(time*scale).toFixed(2)} sec)</div>
				<div>{media[i].title}</div>
			</ComputeMessage>);
		}
		await prisma.$queryRawTyped(UpdateUserMediaAffinity(1, media[i].id))
	}

	// const total = await prisma.media.count();
	// let i = await prisma.mediaRanking.count();
	// while (i < total) {
	// 	if (stream.readyState === StreamResponse.CLOSED) return;

	// 	{
	// 		const rem = total - i;
	// 		const time = (Date.now() - start) / tally * rem;
	// 		stream.send("this", "innerHTML", <ComputeMessage>Calculating {i} of {total} (eta: {(time*scale).toFixed(2)} sec)</ComputeMessage>);
	// 	}
	// 	await prisma.$queryRawTyped(RankNoveltyInit());

	// 	const next = await prisma.mediaRanking.count();
	// 	tally += next-i;
	// 	i = next;
	// }

	// // remove any media with no connections
	// await prisma.mediaRanking.deleteMany({ where: { width: 0 } });

	stream.send("this", "outerHTML", <ComputeMessage>Done</ComputeMessage>);
	stream.close();
}


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}