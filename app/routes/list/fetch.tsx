import { MakeStream, StreamResponse } from "hx-stream/dist/server";
import { UpdateUserAffinityStale } from "@db/sql/UpdateUserAffinityStale.ts";
import { UpdateUserAffinity } from "@db/sql.ts";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { Dialog } from "~/component/dialog.tsx";

import { DecodeSecret } from "~/util/secret.ts";
import { prisma } from "~/db.server.ts";


export function loader() {
	return <Dialog revalidate>
		<h1 style={{ marginTop: "0px" }}>Update Scores</h1>
		<p className="text-muted">Please do not close this window while processing</p>

		<div
			style={{ display: "flex", flexDirection: "column" }}
			hx-put="/list/fetch"
			hx-ext="hx-stream"
			hx-swap="innerHTML"
			hx-stream="on"
			hx-trigger="load"
		>
			<div className="status">Connecting...</div>
			<div className="stage"></div>
		</div>
	</Dialog>
}


export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private");
	const userID = await EnforcePermission(request, cookie);
	return MakeStream(request, { render: renderToString, userID, highWaterMark: 1000 }, Compute);
}

async function Compute(stream: StreamResponse<true>, props: { userID: number }) {
	const userID = props.userID;

	const token = await prisma.userAuthToken.findFirst({
		select:  { access: true },
		where:   { type: "MyAnimeList", userID },
		orderBy: { updatedAt: "desc" }
	});
	if (!token?.access) throw new Error("Your MyAnimeList token expired, please login again");

	const access = DecodeSecret(token.access);

	stream.send(".status", "innerText", "Updating scores from Mal");
	const touched = new Set<number>();
	for await (const chunk of Chunks(access)) {
		for (const rating of chunk) {
			if (rating.score <= 0) continue;
			if (rating.score > 10) continue;
			rating.score /= 10; // re-scale

			stream.send(".stage", "innerText", rating.title);
			const index = await prisma.externalMedia.findUnique({
				select: { mediaID: true },
				where: { type: "MyAnimeList", id: String(rating.id) }
			});
			const mediaID = index?.mediaID;
			if (!mediaID) {
				console.log("missing index", rating.title);
				continue;
			}

			const batch = await prisma.userMediaScore.createMany({
				data: [{ mediaID, userID, score: rating.score }],
				skipDuplicates: true
			});
			let changed = batch.count > 0;
			if (!changed) {
				const batch = await prisma.userMediaScore.updateMany({
					where: { mediaID, userID, updatedAt: { lt: rating.updatedAt } },
					data:  { score: rating.score, updatedAt: rating.updatedAt }
				});
				changed = batch.count > 0;
			}

			if (changed) touched.add(mediaID);
		}

		if (stream.readyState === StreamResponse.CLOSED) return;
	}

	if (touched.size < 1) {
		stream.send(".status", "innerText", "No changes detected!");
		stream.send(".stage", "innerText", "You can now close this window :D");

		stream.close();
	}

	stream.send(".status", "innerText", "Updating user affinities");
	stream.send(".stage", "innerHTML", `<progress style="width: 100%" />`);

	// Stale affected affinities
	await prisma.$queryRawTyped(UpdateUserAffinityStale(userID, [...touched]));

	const max = await prisma.user.findFirstOrThrow({
		select:  { id: true },
		orderBy: { id: "desc" }
	});
	const partition = 1000;
	for (let i=0; i<max.id; i += partition) {
		const p = i/max.id*100;
		stream.send(".stage", "innerHTML", `<progress style="width: 100%" value="${p}" max="100" />`);
		await prisma.$queryRawTyped(UpdateUserAffinity(userID, i, i+partition, 10));

		if (stream.readyState === StreamResponse.CLOSED) return;
	}

	await prisma.userMediaScore.updateMany({ where: { userID }, data:  { affinity: null } });

	stream.send(".status", "innerText", "Done!");
	stream.send(".stage", "innerText", "You can now close this window :D");

	stream.close();
}


async function* Chunks(token: string) {
	let next: string | null = `https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status?limit=1000`;
	while (next) {
		const req = await fetch(next, {
			headers: { Authorization: `Bearer ${token} `}
		});
		if (!req.ok) throw new Error(await req.text());

		const res = await req.json() as {
			data: {
				node: {
					id: number,
					title: string,
				},
				list_status: {
					score: number,
					updated_at: string
				}
			}[],
			paging?: { next: string }
		};
		yield res.data.map(x => ({
			id: x.node.id,
			title: x.node.title,
			updatedAt: new Date(x.list_status.updated_at),
			score: x.list_status.score,
		}));
		// return;

		next = res.paging?.next || null;
	}
}