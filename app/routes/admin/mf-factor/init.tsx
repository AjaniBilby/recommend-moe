import { MakeStream, StreamResponse } from "hx-stream/server";
import { MkInitMedia, MkInitUser } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { prisma } from "~/db.server.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");
	return MakeStream({
		highWaterMark: 1000,
		abortSignal: request.signal,
		render: renderToString,
	}, Compute);
}


const scale = 1/1000;
async function Compute(stream: StreamResponse<true>, props: Record<never, never>) {
	stream.send("this", "innerHTML", <>
		<div className="progress">
			<progress style={{ width: "0%" }} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	const start = Date.now();

	await prisma.mfFactor.deleteMany(); // clear any old values

	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="33" max="100" />`);

	await prisma.$queryRawTyped(MkInitMedia());
	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="66" max="100" />`);

	await prisma.$queryRawTyped(MkInitUser());
	stream.send(".progress", "innerHTML", `<progress style="width: 100%" value="100" max="100" />`);


	const time = (Date.now() - start);
	stream.send(".status", "innerText", `Done! Taking ${(time*scale).toFixed(2)} sec`);
	stream.close();
}
