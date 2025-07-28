import { ExternalKind } from "@db/enums.ts";

import * as Mal from "~/model/external/my-anime-list.ts";
import { Vectorize } from "~/model/embedding.ts";

import { DecodeSecret } from "~/util/secret.ts";
import { prisma } from "~/db.server.ts";

export async function ReIndexMedia(mediaID: number) {
	const external = await prisma.externalMedia.findFirst({
		select: { id: true },
		where:  { mediaID, type: "MyAnimeList" }
	});
	if (!external) return null;

	const data = await GetSource("MyAnimeList", external.id);
	if (!data) return null;

	await prisma.media.update({
		where: { id: mediaID },
		data: { title: data.title, description: data.description, icon: data.icon }
	});
	await IndexTitles(mediaID, data.titles);
}


export async function InsertExternalMedia(type: ExternalKind, id: string) {
	const external = await prisma.externalMedia.findFirst({
		select: { mediaID: true },
		where:  { id, type }
	});
	if (external) return external.mediaID;

	const data = await GetSource("MyAnimeList", id);
	const mediaID = await prisma.$transaction(async (tx) => {
		const slot = await tx.media.create({ data: {
			kind: "Anime",
			title: data.title, description: data.description,
			icon: data.icon
		}});
		await tx.externalMedia.create({ data: { mediaID: slot.id, type, id }})

		return slot.id;
	});

	await IndexTitles(mediaID, data.titles);

	return mediaID;
}


async function GetSource(type: ExternalKind, externID: string) {
	switch (type) {
		case "MyAnimeList": {
			const token = await prisma.userAuthToken.findFirst({
				select:  { id: true, access: true },
				where:   { expiry: { gt: new Date() } },
				orderBy: { updatedAt: "asc" }
			});
			if (!token?.access) throw new Error("No MyAnimeList tokens present");
			const access = DecodeSecret(token?.access);
			const raw = await Mal.GetMedia(access, Number(externID));
			await prisma.userAuthToken.update({ where: { id: token.id }, data: { updatedAt: new Date() }});

			return raw;
		}
		case "AniList": throw new Error("Unimplemented");
	}
}

async function IndexTitles(mediaID: number, titles: { type: string, title: string }[]) {
	const existing = await prisma.mediaTitle.findMany({
		select: { type: true, title: true },
		where:  { mediaID }
	});

	const set: string[] = [];
	for (const data of titles) {
		if (set.includes(data.title)) continue;
		if (existing.some(x => x.title === data.title)) continue;
		set.push(data.title);
	}

	const vectors = await Vectorize(set);

	for (const { type, title } of titles) {
		const i = set.indexOf(title);
		if (i === -1) continue;

		const embedding = vectors.get(title);
		if (!(embedding instanceof Float32Array)) throw new Error("Invalid encoding");

		const vector = Array.from(embedding);
		const exists = existing.some(x => x.type === type);

		const batch = exists
			? await prisma.$executeRaw`
				UPDATE "MediaTitle"
				SET "title" = ${title}::text,
					"embedding" = ${vector}::float[]::vector(384)
				WHERE "mediaID" = ${mediaID}::int and "type" = ${type}`
			: await prisma.$executeRaw`
				INSERT INTO "MediaTitle" ("mediaID", "type", "title", "embedding")
				SELECT ${mediaID}::int, ${type}::text, ${title}::text, ${vector}::float[]::vector(384)`;
	}
}