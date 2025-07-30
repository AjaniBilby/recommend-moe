
import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { FillMediaAffinity } from "@db/sql.ts";
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
		<div className="progress">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	const media = await prisma.media.findMany({
		select:  { id: true, title: true },
		orderBy: { id: "desc" }
	});

	for (let i=0; i<media.length; i++) {
		if (stream.readyState === StreamResponse.CLOSED) return;

		const p = i/media.length;
		stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="${p*100}" max="100" />`);
		stream.send(".status", "innerText", media[i].title);

		await prisma.$queryRawTyped(FillMediaAffinity(media[i].id));
	}

	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="100" max="100" />`);
	stream.send(".status", "innerText", "done");

	stream.close();
}