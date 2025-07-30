import { ExternalKind } from "@db/enums.ts";

import * as Mal from "~/model/external/my-anime-list.ts";
import { MakeEmbeddings } from "~/model/embedding.ts";

import { DecodeSecret } from "~/util/secret.ts";
import { prisma } from "~/db.server.ts";

export async function ReFetchMedia(mediaID: number) {
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
	await InsertTitles(mediaID, data.titles);
	await IndexMedia(mediaID);
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

	await InsertTitles(mediaID, data.titles);
	await IndexMedia(mediaID);

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


async function InsertTitles(mediaID: number, titles: { type: string, title: string }[]) {
	const created = await prisma.mediaTitle.createManyAndReturn({
		select: { type: true },
		data: titles.map(t => ({...t, mediaID })),
		skipDuplicates: true
	});

	for (const { type, title } of titles) {
		if (created.some(x => x.type === type)) continue;

		await prisma.mediaTitle.update({
			select: { mediaID: true },
			where: { mediaID_type: { mediaID, type }},
			data:  { title }
		});
	}
}


export async function IndexMedia(mediaID: number) {
	const { description } = await prisma.media.findUniqueOrThrow({
		select: { description: true },
		where: { id: mediaID }
	})
	const targets = await prisma.mediaTitle.findMany({
		select: { type: true, title: true },
		where:  { mediaID }
	});
	targets.push({ type: "Description", title: description });
	const embeddings = await MakeEmbeddings(targets.map(x => ({ key: x.type, value: x.title })));

	await prisma.$transaction(async (tx) => {
		await tx.mediaEmbedding.deleteMany({ where: { mediaID }});
		for (const target of embeddings) await tx.$executeRaw`
			INSERT INTO "MediaEmbedding" ("mediaID", "type", "embedding")
			SELECT ${mediaID}::int, ${target.key}::text, ${[...target.embedding]}::float[]::vector(384)
			ON CONFLICT DO NOTHING
		`;
	});
}