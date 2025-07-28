import { RouteContext } from "htmx-router";

import { GetUserID } from "~/model/user.ts";

import { Steps } from "~/component/steps.tsx";
import { Link, Open } from "~/component/link.tsx";

import { prisma } from "~/db.server.ts";

export async function loader({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private, no-store, must-revalidate");

	const userID = await GetUserID(request, cookie);
	if (!userID) return <GettingStarted progress={-1}/>;

	const token = await prisma.userAuthToken.findFirst({
		select: { id: true },
		where: { type: "MyAnimeList", userID }
	});
	if (!token) return <GettingStarted progress={1}/>;

	const score = await prisma.userMediaScore.findFirst({
		select: { mediaID: true },
		where: { userID }
	});
	if (!score) return <GettingStarted progress={1}/>;

	const recommend = await prisma.userMediaScore.findFirst({
		select: { mediaID: true },
		where:  { userID, affinity: { not: null }}
	});
	if (!recommend) return <GettingStarted progress={2}/>;

	return <GettingStarted progress={3}/>;
}



export function GettingStarted(props: { progress: number }) {
	return <Steps steps={[
		<div key={0} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
			<div>Login to your MyAnimeList account</div>
			<Open href="/login"><button type="button">Login</button></Open>
		</div>,
		<div key={1}>
			Pull in your MAL scores&nbsp;&nbsp;
			<Link href="/list" className="muted text-mono rounded inline" hx-swap="innerHTML">!list</Link>
		</div>,
		<div key={2}>
			Get your recommendations&nbsp;&nbsp;
			<Link href="/everything" className="muted text-mono rounded inline" hx-swap="innerHTML">!everything</Link>
		</div>,
	]} progress={props.progress} style={{ paddingLeft: "10px" }} />
}