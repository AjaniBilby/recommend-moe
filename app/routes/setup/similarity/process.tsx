import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { UpdateMediaStaleAffinity } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";
import { ReactNode } from "react";

import { prisma } from "~/db.server.ts";

import { shell } from "~/routes/$.tsx";

export function loader() {
	return shell(<div
		hx-put="/setup/similarity/process"
		hx-ext="hx-stream"
		hx-swap="innerHTML"
		hx-stream="on"
		hx-trigger="load"
	></div>, {});
}


export function action({ request, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	return MakeStream(request, { render: renderToString, highWaterMark: 1000 }, Compute);
}



async function Compute(stream: StreamResponse<true>) {
	stream.send("this", "innerHTML", <ComputeMessage>Initializing...</ComputeMessage>);

	let stale = await CountStale();
	let tally = 0;

	stream.send("this", "innerHTML", <ComputeMessage>Found {stale}</ComputeMessage>);

	while (stale > 0) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send("this", "innerHTML", <ComputeMessage>Analyzed {tally} of {stale} {(tally/stale*100).toFixed(3)}%</ComputeMessage>);
		await prisma.$queryRawTyped(UpdateMediaStaleAffinity());

		tally += 100;
		if (tally >= stale) stale = await CountStale();
	}

	stream.send("this", "innerHTML", <ComputeMessage>Done {tally}</ComputeMessage>);
	stream.close();
}


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}

function CountStale() {
	return prisma.mediaAffinity.count({ where: { stale: true } });
}