import { GetUserMediaScoreChunk } from "@db/sql.ts";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { WaitTick } from "~/util/schedule.ts";
import { prisma } from "~/db.server.ts";
import { Lerp } from "~/util/math.ts";

export async function loader({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	headers.append('Content-Disposition', `attachment; filename="scores.bin"`);
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Accel-Buffering', 'no');
	headers.set('Transfer-Encoding', 'chunked');
	headers.set('Content-Type', 'binary/octet-stream');
	headers.set('Keep-Alive', 'timeout=10');
	headers.set('Connection', 'keep-alive');

	const stream = new ReadableStream<Uint8Array>(
		{ start(c) { Stream(c, request.signal).catch(console.error) }, },
		{ highWaterMark: 3*4*100 },
	);

	return new Response(stream, { headers })
}

const recordSize = 4 + 4 + 4;
async function Stream(controller: ReadableStreamDefaultController<Uint8Array>, signal: AbortSignal) {
	await WaitTick();
	const buffer    = new ArrayBuffer(recordSize);
	const view      = new DataView(buffer);
	const uint8View = new Uint8Array(buffer);

	let mediaID = -1;
	let userID  = -1;

	let take = 100;
	let offset = 0;
	while (true) {
		if (signal.aborted) return;

		const start = Date.now();
		const chunk = await prisma.$queryRawTyped(GetUserMediaScoreChunk(mediaID, userID, take));
		if (chunk.length < 1) break;
		if (signal.aborted) return;

		const duration = Date.now() - start;
		const next = Math.floor(take / duration * 700);
		take = Math.max(
			Math.floor(Lerp(take, next, next < take ? 0.5 : 0.1)),
			10
		);

		for (const score of chunk) {
			if (score.score === null) continue;
			if (score.score <= 0    ) continue;
			if (score.score >= 1    ) continue;

			view.setUint32(0,  score.mediaID, true);
			view.setUint32(4,  score.userID, true);
			view.setFloat32(8, score.score, true);
			controller!.enqueue(uint8View.slice());
		}

		const last = chunk[chunk.length-1];
		mediaID = last.mediaID;
		userID  = last.userID;

		offset += chunk.length;
	}

	controller.close();
};