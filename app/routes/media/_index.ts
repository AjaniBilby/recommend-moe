import { ReFetchMedia } from "~/model/media.ts";
import { prisma } from "~/db.server.ts";

export async function loader () {
	const missing = await prisma.media.findMany({
		select: { id: true },
		where:  { description: "" },
		orderBy: { popularRank: "asc" }
	});

	for (const { id } of missing) {
		try {
			await ReFetchMedia(id);
		} catch (e) {
			console.log("id", id);
			console.error(e);
		}
	}

	return "ok";
}