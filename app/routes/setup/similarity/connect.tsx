
import { FillMediaAffinity } from "@prisma/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";
import { ReactNode } from "react";

import { prisma } from "~/db.server.ts";

import { shell } from "~/routes/$.tsx";

export function loader() {
	return shell(<div
		hx-put="/setup/similarity/connect"
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
	const media = await prisma.media.findMany({
		select:  { id: true, title: true },
		orderBy: { id: "desc" }
	});

	for (let i=0; i<media.length; i++) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send("this", "innerHTML", <ComputeMessage>Connected {i} of {media.length}: {media[i].title}</ComputeMessage>);
		await prisma.$queryRawTyped(FillMediaAffinity(media[i].id));
	}

	stream.send("this", "outerHTML", <ComputeMessage>Done</ComputeMessage>);
	stream.close();
}


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}