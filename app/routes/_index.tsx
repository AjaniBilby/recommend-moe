import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { RouteContext } from "htmx-router";

import { shell } from "~/routes/$.tsx";

import { DrainFormStreamField, FormStream } from "../util/form.ts";
import { renderToString } from "react-dom/server";
import { Timeout } from "../util/schedule.ts";
import { prisma } from "~/db.server.ts";

export async function loader() {
	console.log(await prisma.user.findMany());

	return shell(<div hx-ext="hx-stream">
		<form method="POST" encType="multipart/form-data" hx-target="#results" hx-swap="innerHTML" hx-stream="on">
			<input name="email" defaultValue="test@example.com"></input>
			<input name="pass"  defaultValue="password"></input>
			<input type="file" name="file"></input>
			<button type="submit">submit</button>
		</form>

		<div id="results"></div>
	</div>, { title: "Test" });
}



export function action({ request }: RouteContext) {
	return MakeStream(request, { render: renderToString, request, highWaterMark: 1000 }, Process);
}

async function Process(stream: StreamResponse<true>, props: { request: Request }) {
	await Timeout(1000);
	stream.send("this", "innerHTML", <div>init...</div>);

	for await (const field of FormStream(props.request)) {
		if (!field.disposition.filename) {
			const buffer = await DrainFormStreamField(field.stream.getReader());

			const value = new TextDecoder().decode( buffer );
			console.log(field.disposition.name, value);
			continue;
		}

		console.log("FILE", field.disposition);

		const textStream = field.stream.pipeThrough(new TextDecoderStream());
		let timer = Date.now() + 500;
		let count = 0;
		for await (const textChunk of textStream) {
			// Note: This line counting logic is preserved from the original code.
			// See the explanation below for a more robust alternative.
			count += textChunk.split("\n").length;

			const now = Date.now();
			if (now > timer) {
				timer = now + 500;
				stream.send("this", "innerHTML", <b>{count}</b>);
				console.log(count);
				await Timeout(10);
			}
    }
		stream.send("this", "beforeend", <div>done {count}</div>);
	}


	stream.close();
}