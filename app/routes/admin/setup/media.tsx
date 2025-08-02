import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { InsertExternalMedia } from "~/model/media.ts";
import { EnforcePermission } from "~/model/permission.ts";

import { Container } from "~/component/container.tsx";

import { CsvFormStream, CsvStream } from "~/util/format/csv.ts";
import { shell } from "~/routes/$.tsx";

export function loader() {
	return shell(<Container>
		<h1 style={{ marginTop: "15px" }}>Import Media</h1>

		<form method="POST" encType="multipart/form-data" hx-swap="innerHTML" hx-stream="on" hx-ext="hx-stream" hx-target="this">
			<div style={{ display: "flex", gap: "10px" }}>
				<input type="file" name="file"></input>
				<button type="submit">submit</button>

			</div>

			<div id="results"></div>
		</form>

	</Container>, { title: "Admin - Import Media" });
}



export async function action({ request, cookie }: RouteContext) {
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	const csv = await CsvFormStream(request, ["anime_id"] as const);
	return MakeStream(request, { render: renderToString, csv, highWaterMark: 1000 }, ProcessCsv);
}

type CsvStream = AsyncGenerator<Record<"anime_id", string>, void, unknown>;
async function ProcessCsv(stream: StreamResponse<true>, props: { csv: CsvStream }) {
	stream.send(".results", "innerHTML", <div>init...</div>);

	const mediaMap = new Map<string, number>();
	let count = 0;
	for await (const { anime_id } of props.csv) {
		let mediaID = mediaMap.get(anime_id);
		if (!mediaID) {
			try {
				mediaID = await InsertExternalMedia("MyAnimeList", anime_id);
				mediaMap.set(anime_id, mediaID);
			} catch (e) {
				console.error(e);
			}
		}


		count ++;
		if (count % 10_000 === 0) {
			stream.send(".results", "innerHTML", <div>imported {count}</div>);
			console.log(count);
		}
	}


	stream.close();
}