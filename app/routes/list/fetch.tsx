import { UpdateUserAffinity } from "@db/sql.ts";
import { RouteContext } from "htmx-router";
import { revalidate } from "htmx-router/response";

import { EnforcePermission } from "~/model/permission.ts";

import { DecodeSecret } from "~/util/secret.ts";
import { prisma } from "~/db.server.ts";

export async function action({ request, cookie }: RouteContext) {
	const userID = await EnforcePermission(request, cookie);

	const token = await prisma.userAuthToken.findFirst({
		select:  { access: true },
		where:   { type: "MyAnimeList", userID },
		orderBy: { updatedAt: "desc" }
	});
	if (!token?.access) throw new Error("Your MyAnimeList token expired, please login again");

	const access = DecodeSecret(token.access);

	for await (const chunk of Chunks(access)) {
		for (const rating of chunk) {
			if (rating.score <= 0) continue;
			if (rating.score > 10) continue;
			rating.score /= 10; // re-scale

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
		}
	}

	// Stale all affinities
	await prisma.userAffinity.updateMany({
		where: { OR: [ { aID: userID }, { bID: userID } ]},
		data:  { stale: true }
	});

	const max = await prisma.user.findFirstOrThrow({
		select:  { id: true },
		orderBy: { id: "desc" }
	});
	const partition = 10_000;
	for (let i=0; i<max.id; i += partition) {
		console.log(userID, i, i+partition, 10, i/max.id);
		console.time("User Affinity");
		await prisma.$queryRawTyped(UpdateUserAffinity(userID, i, i+partition, 10));
		console.timeEnd("User Affinity");
	}

	return revalidate();
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