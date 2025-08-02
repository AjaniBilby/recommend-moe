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
			<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
				<input type="file" name="file"></input>
				<button type="submit">submit</button>

				<div className="output contents"></div>
			</div>

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
	stream.send(".output", "innerHTML", <div>collecting...</div>);

	const targets = new Set<number>();
	let stale = 0;
	for await (const { anime_id } of props.csv) {
		const id = Number(anime_id);
		if (isNaN(id) || id < 0) continue;
		targets.add(id);
		stale++;
		if (stale > 100) {
			stream.send(".output", "innerHTML", <div>collecting {targets.size}...</div>);
			stale = 0;
		}
	}

	console.log(targets);
	stream.send(".output", "innerHTML", <progress style={{ width: "100%" }} max={100}></progress>);

	let i = 0;
	for (const id of targets) {
		try {
			await InsertExternalMedia("MyAnimeList", String(id));
		} catch (e) { console.error(e); }

		stream.send(".output", "innerHTML", `<progress style="width: 100%" value="${i/targets.size*100}" max="100" />`);
		i++;
	}


	stream.close();
}