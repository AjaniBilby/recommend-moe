import { UpdateUserMediaAffinity } from "@db/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";
import { Dialog } from "~/component/dialog.tsx";

import { TIME_SCALE } from "~/util/time.ts";
import { prisma } from "~/db.server.ts";


export function loader() {
	return <Dialog revalidate>
		<h1 style={{ marginTop: "0px" }}>Updating Affinities</h1>
		<p className="text-muted">Please do not close this window while processing</p>

		<div
			style={{ display: "flex", flexDirection: "column" }}
			hx-put="/everything/index"
			hx-ext="hx-stream"
			hx-swap="innerHTML"
			hx-stream="on"
			hx-trigger="load"
		>
			<div className="progress"><progress style={{ width: "100%" }} /></div>
			<div className="status text-muted"></div>
		</div>
	</Dialog>
}


export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private");
	const userID = await EnforcePermission(request, cookie);
	return MakeStream({ render: renderToString, userID, highWaterMark: 1000, abortSignal: request.signal }, Compute);
}

const scale = 1/TIME_SCALE.minute;
async function Compute(stream: StreamResponse<true>, props: { userID: number }) {
	const userID = props.userID;
	const start = Date.now();

	stream.send(".status", "innerText", "preparing...");

	const media =await prisma.media.findMany({
		select: { id: true },
		where: {
			userScores: { none: { userID, affinity: null }}
		},
		orderBy: { id: "asc" }
	});

	for (let i=0; i<media.length; i++) {
		if (stream.readyState === StreamResponse.CLOSED) return;
		const mediaID = media[i].id;
		if (!mediaID) continue;

		const p = i / media.length;

		if (i % (2**5) === 0) { // only log on 2^5 interval (avg exec = 58ms)
			stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${p*100}" max="100" />`);

			if (p > 0) {
				const time = (Date.now() - start) / p;
				stream.send(".status", "innerText", `ETA ${(time*scale).toFixed(2)} mins`);
			}
		}


		await prisma.$queryRawTyped(UpdateUserMediaAffinity(userID, mediaID));
	}

	stream.send(".progress", "innerText", "You can now close this window :D");
	stream.send(".status", "innerText", "Done!");
}