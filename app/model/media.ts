import { ExternalKind } from "@db/enums.ts";
import { prisma } from "../db.server.ts";

export async function ReIndexMedia(mediaID: number) {
	const data = await GetSource(mediaID, "MyAnimeList");
	if (!data) return null;

	await prisma.media.update({
		where: { id: mediaID },
		data: { title: data.title, description: data.description, icon: data.icon }
	});
}


async function GetSource(mediaID: number, type: ExternalKind) {
	const external = await prisma.externalMedia.findFirst({
		select: { id: true },
		where:  { mediaID, type }
	});
	if (!external) return null;

	switch (type) {
		case "MyAnimeList": {
			const req = await fetch(`https://api.jikan.moe/v4/anime/${external.id}`);
			if (!req.ok) throw new Error(await req.text());

			const { data } = await req.json();

			const titles: Array<{ type: string, title: string }> = data.titles || [];

			return {
				title: data.title || undefined,
				description: data.synopsis || undefined,
				icon: data.images.webp?.large_image_url
					|| data.images.jpg?.large_image_url
					|| undefined,
				titles
			}
		}
		case "AniList": throw new Error("Unimplemented");
	}
}