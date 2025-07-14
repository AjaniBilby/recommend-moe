import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { UpdateMediaNovelty } from "db/sql.ts";
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



async function Compute(stream: StreamResponse<true>) {
	const media = await prisma.media.findMany({
		select:  { id: true, title: true },
		orderBy: { id: "desc" }
	});

	for (let i=0; i<media.length; i++) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send("this", "innerHTML", <ComputeMessage>Calculating {i} of {media.length}: {media[i].title}</ComputeMessage>);
		await prisma.$queryRawTyped(UpdateMediaNovelty(media[i].id));
	}

	stream.send("this", "outerHTML", <ComputeMessage>Done</ComputeMessage>);
	stream.close();
}


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}