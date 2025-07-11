import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { RouteContext } from "htmx-router";

import { shell } from "~/routes/$.tsx";

import { renderToString } from "react-dom/server";
import { Timeout } from "~/util/schedule.ts";
import { prisma } from "~/db.server.ts";

export async function loader() {
	return shell(<div hx-ext="hx-stream">
		<form method="POST" encType="multipart/form-data" hx-target="#results" hx-swap="innerHTML" hx-stream="on">
			<button type="submit">submit</button>
		</form>

		<div id="results"></div>
	</div>, { title: "Test" });
}



export function action({ request }: RouteContext) {
	return MakeStream(request, { abortSignal: request.signal, render: renderToString, highWaterMark: 1000 }, Process);
}

async function Process(stream: StreamResponse<true>) {
	for (let i=0; i<10; i++) {
		await Timeout(1000);
		stream.send("this", "beforeend", <b>{i}</b>);
	}

	stream.close();
}