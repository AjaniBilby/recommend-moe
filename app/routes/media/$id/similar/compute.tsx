import { FillMediaAffinity, UpdateMediaAffinity } from "@prisma/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";
import { ReactNode } from "react";

import { MediaLoader } from "~/component/media.tsx";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export function action({ request, params, headers }: RouteContext<typeof parameters>) {
	headers.set("Cache-Control", "no-cache, no-store");

	return MakeStream(request, { render: renderToString, mediaID: params.id, highWaterMark: 1000 }, Compute);
}


export async function ShouldCompute(mediaID: number) {
	if (await IsComplete(mediaID)) return null;

	return <div
		style={{ gridColumn: "1/-1"}}
		hx-put={`/media/${mediaID}/similar/compute`}
		hx-ext="hx-stream"
		hx-swap="innerHTML"
		hx-stream="on"
		hx-trigger="load"
	>
		<ComputeMessage>computing...</ComputeMessage>
	</div>
}

async function IsComplete(mediaID: number) {
	const current = await prisma.mediaAffinity.count({
		where: { OR: [{ aID: mediaID }, { bID: mediaID }] }
	});

	const shows = await prisma.media.count() - 1;

	return current >= shows;
}


async function Compute(stream: StreamResponse<true>, props: { mediaID: number }) {
	const mediaID = props.mediaID;

	if (!await IsComplete(mediaID)) {
		stream.send("this", "innerHTML", <ComputeMessage>Checking for missing entries...</ComputeMessage>);
		await prisma.$queryRawTyped(FillMediaAffinity(mediaID));
	}

	let stale = await CountStale(mediaID);

	const total = await prisma.mediaAffinity.count({
		where: { OR: [{ aID: mediaID }, { bID: mediaID }] }
	});

	while (stale > 0) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send("this", "innerHTML", <ComputeMessage>Analyzed {total-stale} of {total}</ComputeMessage>);

		await prisma.$queryRawTyped(UpdateMediaAffinity(mediaID));
		stale = await CountStale(mediaID);
	}

	stream.send("this", "outerHTML", <MediaLoader href={`/media/${mediaID}/similar`} />);
	stream.close();
}


function ComputeMessage(props: { children: ReactNode }) {
	return <div className="muted card" style={{ padding: "var(--radius)", display: "flex", alignItems: "center", gap: "10px" }}>
		{props.children}
	</div>;
}


function CountStale(mediaID: number) {
	return prisma.mediaAffinity.count({
		where: {
			OR: [{ aID: mediaID }, { bID: mediaID }],
			stale: true
		}
	})
}