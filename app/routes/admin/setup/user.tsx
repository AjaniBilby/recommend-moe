import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { CsvFormStream, CsvStream } from "~/util/format/csv.ts";
import { Container } from "~/component/container.tsx";
import { shell } from "~/routes/$.tsx";

export function loader() {
	return shell(<Container>
		<form method="POST" encType="multipart/form-data" hx-swap="innerHTML" hx-stream="on" hx-ext="hx-stream" hx-target="this">
			<div style={{ display: "flex", gap: "10px" }}>
				<input type="file" name="file"></input>
				<button type="submit">submit</button>

			</div>

			<div id="results"></div>
		</form>

		<div id="results"></div>
	</Container>, { title: "Admin - Import Users" });
}



export async function action({ request, cookie }: RouteContext) {
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	const csv = await CsvFormStream(request, ["username", "user_id"] as const);
	return MakeStream(request, { render: renderToString, csv, highWaterMark: 1000 }, ProcessCsv);
}

type CsvStream = AsyncGenerator<Record<"user_id" | "username", string>, void, unknown>;
async function ProcessCsv(stream: StreamResponse<true>, props: { csv: CsvStream }) {
	stream.send("this", "innerHTML", <div>init...</div>);

	let count = 0;
	for await (const lines of props.csv) {

		count ++;
		if (count % 10_000 === 0) {
			stream.send(".results", "innerHTML", <div>imported {count}</div>);
			console.log(count);
		}
	}


	stream.close();
}