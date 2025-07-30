import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";
import { IndexMedia } from "~/model/media.ts";

import { Dialog } from "~/component/dialog.tsx";

import { prisma } from "~/db.server.ts";


export async function loader({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	return <Dialog revalidate>
		<h1 style={{ marginTop: "0px" }}>Index Media</h1>
		<p className="text-muted">Please do not close this window while processing</p>

		<div
			style={{ display: "flex", flexDirection: "column" }}
			hx-put="/media/reindex"
			hx-ext="hx-stream"
			hx-swap="innerHTML"
			hx-stream="on"
			hx-trigger="load"
		>
			<div className="progress"><progress style={{ width: "100%" }} /></div>
			<div className="stage"></div>
		</div>
	</Dialog>
}


export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private");
	const userID = await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	return MakeStream(request, { render: renderToString, userID, highWaterMark: 1000 }, Compute);
}

async function Compute(stream: StreamResponse<true>) {
	stream.send(".stage", "innerText", "Loading media");

	const medias = await prisma.media.findMany({
		select:  { id: true, title: true },
		orderBy: { id: "asc" }
	});

	stream.send(".stage", "innerText", "Embedding");

	for (let i=0; i<medias.length; i++) {
		if (stream.readyState === StreamResponse.CLOSED) return;

		const media = medias[i];
		const p = i/medias.length;

		stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${p*100}" max="100" />`);
		stream.send(".stage", "innerText", media.title);
		await IndexMedia(media.id);
	}

	stream.send(".progress", "innerHTML", '<progress style="width: 100%" value="100" max="100" />');
	stream.send(".stage", "innerText", "You can now close this window :D");

	stream.close();
}