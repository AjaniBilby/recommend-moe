import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { shell } from "~/routes/$.tsx";

import { CsvFormStream, CsvStream } from "~/util/format/csv.ts";
import { BatchGeneratorResults } from "~/util/format/stream.ts";
import { prisma } from "~/db.server.ts";

export function loader() {
	return shell(<div hx-ext="hx-stream">
		<form method="POST" encType="multipart/form-data" hx-target="#results" hx-swap="innerHTML" hx-stream="on">
			<input type="file" name="file"></input>
			<button type="submit">submit</button>
		</form>

		<div id="results"></div>
	</div>, { title: "Test" });
}



export async function action({ request }: RouteContext) {
	const csv = await CsvFormStream(request, ["title", "anime_id", "image_url"] as const);

	return MakeStream(request, { render: renderToString, csv, highWaterMark: 1000 }, ProcessCsv);
}

type CsvStream = AsyncGenerator<Record<"title" | "anime_id" | "image_url", string>, void, unknown>;
async function ProcessCsv(stream: StreamResponse<true>, props: { csv: CsvStream }) {
	stream.send("this", "innerHTML", <div>init...</div>);

	let count = 0;
	for await (const lines of BatchGeneratorResults(props.csv, 100)) {

		await prisma.media.createMany({
			data: lines.map(l => ({
				kind: "Anime",
				title: l["title"]     || "",
				icon:  l["image_url"] || ""
			})),
			skipDuplicates: true
		});

		const media = await prisma.media.findMany({
			select: { title: true, id: true },
			where:  { title: { in: lines.map(x => x["title"])}}
		});
		for (const m of media) m.title = m.title.toLowerCase();

		const links = [];
		for (const l of lines) {
			const title = l["title"].toLowerCase();
			const m = media.find(m => m.title == title);
			if (!m) continue;

			links.push({
				type: "MyAnimeList" as const,
				id: l["anime_id"],
				mediaID: m.id
			});
		}

		const batch = await prisma.externalMedia.createMany({
			data: links,
			skipDuplicates: true
		});
		count += batch.count;

		stream.send("this", "innerHTML", <div>imported {count}</div>);
	}


	stream.close();
}