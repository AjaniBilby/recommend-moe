import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { IngestUserScores } from "@prisma/sql.ts";
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
	const csv = await CsvFormStream(request, ["username", "anime_id", "my_score"] as const);

	return MakeStream(request, { render: renderToString, csv, highWaterMark: 1000 }, ProcessCsv);
}

type CsvStream = AsyncGenerator<Record<"anime_id" | "username" | "my_score", string>, void, unknown>;
async function ProcessCsv(stream: StreamResponse<true>, props: { csv: CsvStream }) {
	stream.send("this", "innerHTML", <div>init...</div>);

	const start = Date.now();
	let count = 0;

	const resolve = (delta: number) => {
		count += delta;
		console.log(count, (count / (Date.now()-start)).toFixed(2));
	}

	for await (const lines of BatchGeneratorResults(props.csv, 10_000)) Batch(lines).then(resolve).catch(console.error);

	stream.close();
}


async function Batch(lines: Record<"username" | "anime_id" | "my_score", string>[]) {
	const json = lines.map(x => ({
		user_id:  x.username,
		media_id: x.anime_id,
		score: (Number(x.my_score) || 0)/10
	}));
	await prisma.$queryRawTyped(IngestUserScores("MyAnimeList", JSON.stringify(json)));
	return lines.length;
}