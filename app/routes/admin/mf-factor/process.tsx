import { MfStepMedia, MfStepUser, MfStep, MfStats } from "@db/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { ChunkArray } from "~/util/format/array.ts";
import { prisma } from "~/db.server.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");
	return MakeStream({ render: renderToString, highWaterMark: 1000, abortSignal: request.signal }, Compute);
}

const LEARNING_RATE = 0.0002;
const MAX_STEPS  = 20;
const SCALE  = 1/1000;
const PARRALLEL = 100;

async function Compute(stream: StreamResponse<true>) {
	stream.send("this", "innerHTML", <>
		<div className="iteration">
			<progress style={{ width: "100%" }} value={0} max={MAX_STEPS}></progress>
		</div>
		<div className="media">
			<progress style={{ width: "100%" }} max={100}></progress>
		</div>
		<div className="user">
			<progress style={{ width: "100%" }} value={0} max={100}></progress>
		</div>
		<div className="status"></div>
	</>);

	const targets = await GetTargets();
	for (let step=0; step<MAX_STEPS; step++) {
		const start = Date.now();

		stream.send(".user", "innerHTML", `<progress style="width: 100%" value={0} max="${targets.user.length}" />`);

		for (let i=0; i<targets.media.length; i++) {
			await Promise.all(targets.media[i].map(u => prisma.$queryRawTyped(MfStepMedia(u, LEARNING_RATE))));
			if (stream.readyState === StreamResponse.CLOSED) return;
			stream.send(".media", "innerHTML", `<progress style="width: 100%" value="${i+1}" max="${targets.media.length}" />`);
		}
		const mediaStats = (await prisma.$queryRawTyped(MfStats('MEDIA')))[0];
		await prisma.$queryRawTyped(MfStep('MEDIA'));

		for (let i=0; i<targets.user.length; i++) {
			await Promise.all(targets.user[i].map(u => prisma.$queryRawTyped(MfStepUser(u, LEARNING_RATE))));
			if (stream.readyState === StreamResponse.CLOSED) return;
			stream.send(".user", "innerHTML", `<progress style="width: 100%" value="${i+1}" max="${targets.user.length}" />`);
		}
		const userStats = (await prisma.$queryRawTyped(MfStats('USER')))[0];
		await prisma.$queryRawTyped(MfStep('USER'));

		if (stream.readyState === StreamResponse.CLOSED) return;
		stream.send(".status", "afterbegin", <div style={{
			marginBlock: '1rem',
			marginLeft:  '1em',

			display: 'grid',
			gridTemplateColumns: "auto auto 1fr",
			justifyContent: 'flex-start',
			gap: '0 10px'
		}}>
			<b>Step</b>
			<div>{step+1} of {MAX_STEPS}</div>
			<div className="text-right">{((Date.now()-start)*SCALE).toFixed(2)} sec</div>
			{RenderStats(mediaStats)}
			{RenderStats(userStats)}
		</div>);
		stream.send(".iteration", "innerHTML", `<progress style="width: 100%" value="${step+1}" max="${MAX_STEPS}" />`);
	}

	stream.close();
}

async function GetTargets() {
	const medias = await prisma.mfFactor.findMany({
		select: { id: true },
		where:  { type: 'MEDIA' }
	});

	const users = await prisma.mfFactor.findMany({
		select: { id: true },
		where:  { type: 'USER' }
	});

	return {
		media: ChunkArray(medias.map(x => x.id), PARRALLEL),
		user:  ChunkArray(users.map(x => x.id), PARRALLEL),
	}
}


function RenderStats(s: { type: 'MEDIA' | 'USER', error: number | null, next: number | null }) {
	const errorValue = s.error || 0;
	const nextValue  = s.next  || 0;

	let change;
	if (errorValue === 0) {
		change = nextValue > 0 ? 100 : 0; // Handle division by zero
	} else {
		change = ((nextValue - errorValue) / errorValue) * 100;
	}

	return <div className="contents">
		<b className="text-capital">{s.type.toLowerCase()}</b>
		<div>Error {nextValue}</div>
		<div className="text-right">{change > 0 ? '+' : ''}{change.toFixed(2)}%</div>
	</div>
}
