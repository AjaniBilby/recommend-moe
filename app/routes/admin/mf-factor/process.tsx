import { MfStepMedia, MfStepUser, MfStep, MfStats } from "@db/sql.ts";
import { MakeStream, StreamResponse } from "hx-stream/server";
import { renderToString } from "react-dom/server";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { JobQueue } from "~/util/schedule.ts";
import { prisma } from "~/db.server.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");
	return MakeStream({ render: renderToString, highWaterMark: 1000, abortSignal: request.signal }, Compute);
}

const LEARNING_RATE = {
	media: 0.05,
	user:  0.01
};
const MAX_STEPS  = 30;
const SCALE  = 1/1000;
const PARRALLEL = 20;
const INTERVAL = 700;

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

	let firstDraw = true;
	const targets = await GetTargets();
	for (let step=0; step<MAX_STEPS; step++) {
		const start = Date.now();

		stream.send(".media", "innerHTML", `<progress style="width: 100%" value="0" max="${targets.media.ids.length}" />`);
		stream.send(".user",  "innerHTML", `<progress style="width: 100%" value="0" max="${targets.user.ids.length}"  />`);

		let nextDraw = Date.now() + INTERVAL;
		await JobQueue({
			concurrency: PARRALLEL,
			tasks: targets.media.ids,
			task: async (mediaID) => {
				await prisma.$queryRawTyped(MfStepMedia(mediaID, LEARNING_RATE.media));
				return;
			},

			notify: (completed, total) => {
				const n = Date.now();
				if (n < nextDraw) return;

				stream.send(".media", "innerHTML", `<progress style="width: 100%" value="${completed}" max="${total}" />`);
				nextDraw = n + INTERVAL;
			}
		});
		await prisma.$queryRawTyped(MfStep('MEDIA'));
		const mediaStats = (await prisma.$queryRawTyped(MfStats('MEDIA')))[0];
		stream.send(".media", "innerHTML", `<progress style="width: 100%" value="${targets.media.ids.length}" max="${targets.media.ids.length}" />`);

		await JobQueue({
			concurrency: PARRALLEL,
			tasks: targets.user.ids,
			task: async (userID) => {
				await prisma.$queryRawTyped(MfStepUser(userID, LEARNING_RATE.media));
				return;
			},

			notify: (completed, total) => {
				const n = Date.now();
				if (n < nextDraw) return;

				stream.send(".user", "innerHTML", `<progress style="width: 100%" value="${completed}" max="${total}" />`);
				nextDraw = n + INTERVAL;
			},
		});
		await prisma.$queryRawTyped(MfStep('USER'));
		const userStats = (await prisma.$queryRawTyped(MfStats('USER')))[0];
		stream.send(".user",  "innerHTML", `<progress style="width: 100%" value="${targets.user.ids.length}"  max="${targets.user.ids.length}"  />`);

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
			{RenderStats(targets.media, mediaStats)}
			{RenderStats(targets.user,  userStats)}
		</div>);
		stream.send(".iteration", "innerHTML", `<progress style="width: 100%" value="${step+1}" max="${MAX_STEPS}" />`);

		if (firstDraw) {
			firstDraw = false;
			await prisma.mfFactor.deleteMany({ where: { nextError: null } });
		}

		await prisma.$executeRaw`VACUUM ANALYZE "MfFactor";`;
	}

	stream.send(".media", "innerHTML", `<progress style="width: 100%" value="${targets.media.ids.length}" max="${targets.media.ids.length}" />`);
	stream.send(".media", "innerHTML", `<progress style="width: 100%" value="${targets.user.ids.length}"  max="${targets.user.ids.length}"  />`);

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
		media: {
			ids: medias.map(x => x.id),
			error: 0
		},
		user: {
			ids: users.map(x => x.id),
			error: 0
		},
	}
}


function RenderStats(ctx: { error: number }, s: { type: 'MEDIA' | 'USER', error: number | null }) {
	const errorValue = ctx.error || 0;
	const nextValue  = s.error   || 0;

	ctx.error = nextValue;

	let change;
	if (errorValue === 0) {
		change = nextValue > 0 ? 100 : 0; // Handle division by zero
	} else {
		change = (1.0 - (errorValue/nextValue)) * 100.0;
	}

	return <div className="contents">
		<b className="text-capital">{s.type.toLowerCase()}</b>
		<div>Error {nextValue}</div>
		<div className="text-right">{change > 0 ? '+' : ''}{change.toFixed(2)}%</div>
	</div>
}
