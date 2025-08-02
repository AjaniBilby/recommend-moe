import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { InsertExternalUser } from "~/model/user.ts";
import { EnforcePermission } from "~/model/permission.ts";

import { Container } from "~/component/container.tsx";

import { CsvFormStream, CsvStream } from "~/util/format/csv.ts";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export function loader() {
	return shell(<Container>
		<h1 style={{ marginTop: "15px" }}>Import User</h1>

		<form method="POST" encType="multipart/form-data" hx-swap="innerHTML" hx-stream="on" hx-ext="hx-stream" hx-target="this">
			<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
				<input type="file" name="file"></input>
				<button type="submit">submit</button>

				<div className="output contents"></div>
			</div>

		</form>

	</Container>, { title: "Admin - Import User Scores" });
}



export async function action({ request, cookie }: RouteContext) {
	await EnforcePermission(request, cookie, "USER_MODIFY");

	const csv = await CsvFormStream(request, ["username", "anime_id", "my_score", "my_status"] as const);
	return MakeStream(request, { render: renderToString, csv, highWaterMark: 1000 }, ProcessCsv);
}

type CsvStream = AsyncGenerator<Record<"username" | "anime_id" | "my_score" | "my_status", string>, void, unknown>;
async function ProcessCsv(stream: StreamResponse<true>, props: { csv: CsvStream }) {
	stream.send(".output", "innerHTML", <div>collecting...</div>);

	let inserts = 0;
	let users = 0;
	let username = "";
	let batch = new Array<{ externalID: string, value: number }>();

	const insert = async () => {
		if (batch.length < 1) return;
		const userID = await InsertExternalUser("MyAnimeList", username.toLowerCase());

		const media = await prisma.externalMedia.findMany({
			select: { id: true, mediaID: true },
			where: {
				type: "MyAnimeList",
				id: { in: batch.map(x => x.externalID )}
			}
		});

		const data = [];
		for (const score of batch) {
			const m = media.find(x => x.id === score.externalID);
			if (!m) continue;
			data.push({ userID, mediaID: m.mediaID, score: score.value })
		}

		const query = await prisma.userMediaScore.createMany({
			data: data,
			skipDuplicates: true
		});

		stream.send(".output", "innerText", `Inserting ${username}`);
		users++;
		batch = [];
		inserts += query.count;
		console.log(users, inserts);
	}

	for await (const row of props.csv) {
		const next = row.username.toLowerCase();
		if (next != username) {
			await insert();
			username = next;
		}

		if (row.my_status !== "2") continue;

		const id = Number(row.anime_id);
		if (isNaN(id) || id < 0) continue;

		let score = Number(row.my_score);
		if (isNaN(score)) continue;
		if (score < 0) continue;
		if (score > 10) continue;

		score /= 10;

		batch.push({ externalID: String(id), value: score });
	}

	await insert();

	stream.send(".output", "innerText", `Inserted ${users} users, and ${inserts} scores`);
	stream.close();
}