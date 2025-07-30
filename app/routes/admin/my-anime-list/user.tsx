import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { shell } from "~/routes/$.tsx";

import { CsvFormStream, CsvStream } from "~/util/format/csv.ts";
import { BatchGeneratorResults } from "~/util/format/stream.ts";
import { ShapeArray } from "~/util/format/object.ts";
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
	const csv = await CsvFormStream(request, ["username", "user_id"] as const);

	return MakeStream(request, { render: renderToString, csv, highWaterMark: 1000 }, ProcessCsv);
}

type CsvStream = AsyncGenerator<Record<"user_id" | "username", string>, void, unknown>;
async function ProcessCsv(stream: StreamResponse<true>, props: { csv: CsvStream }) {
	stream.send("this", "innerHTML", <div>init...</div>);

	let count = 0;
	for await (const lines of BatchGeneratorResults(props.csv, 1000)) {

		const users = new Map<string, string>();
		for (const line of lines) users.set(line.username || "", line.user_id || "");

		const existing = await prisma.externalUser.findMany({
			select: { id: true },
			where:  { id: { in: [...users.keys()]}}
		});

		for (const e of existing) users.delete(e.id);
		users.delete("");

		const missing = [...users].map(x => ShapeArray(["username", "user_id"] as const, x));
		await prisma.$transaction(async (tx) => {
			const blank = await tx.user.createManyAndReturn({
				select: { id: true },
				data: missing.map(() => ({}))
			});

			await tx.externalUser.createMany({
				data: blank.map((b, i) => ({
					type: "MyAnimeList",
					id: missing[i].username || "",
					userID: b.id,
					data: missing[i]
				}))
			})
		});

		count += missing.length;
		if (missing.length > 0) {
			stream.send("this", "innerHTML", <div>imported {count}</div>);
			console.log(count);
		}
	}


	stream.close();
}