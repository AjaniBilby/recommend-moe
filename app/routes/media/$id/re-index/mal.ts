import { RouteContext } from "htmx-router";
import { prisma } from "~/db.server.ts";

import { pipeline } from '@huggingface/transformers';

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const titles = [
		{ type: "Default", title: "Elfen Lied" },
		{ type: "Synonym", title: "Elfen Song" },
		{ type: "Synonym", title: "Elfic Song" },
		{ type: "Synonym", title: "Elf Song" },
		{ type: "Japanese", title: "エルフェンリート" },
		{ type: "English", title: "Elfen Lied" }
	];

	const existing = await prisma.mediaTitle.findMany({
		select: { type: true, title: true },
		where:  { mediaID: params.id }
	});

	const set: string[] = [];
	for (const data of titles) {
		if (set.includes(data.title)) continue;
		if (existing.some(x => x.title === data.title)) continue;
		set.push(data.title);
	}

	const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	const outputs = await extractor(set, { pooling: 'mean', normalize: true });

	if (outputs.dims[1] !== 384) throw new Error("Outputs are not in the correct vector format");

	const updates = new Array<{ title: string, type: string, embedding: number[] }>()
	for (const { type, title } of titles) {
		const i = set.indexOf(title);
		if (i === -1) continue;

		const width = outputs.dims[1]
		const embedding = outputs.data.slice(i*width, (i+1)*width);
		if (!(embedding instanceof Float32Array)) throw new Error("Invalid encoding");

		// updates.push({ type: title.type, title: title.title, embedding: Array.from(embedding) });
		const vector = Array.from(embedding);

		const batch = (existing.some(x => x.type === type))
			? await prisma.$executeRaw`
				UPDATE "MediaTitle"
				SET "title" = ${title}::text,
					"embedding" = ${vector}::float[]::vector(384)
				WHERE "mediaID" = ${params.id}::int and "type" = ${type}`
			: await prisma.$executeRaw`
				INSERT INTO "MediaTitle" ("mediaID", "type", "title", "embedding")
				SELECT ${params.id}::int, ${type}::text, ${title}::text, ${vector}::float[]::vector(384)`;
		console.log(batch);
	}


	console.log(updates);
}