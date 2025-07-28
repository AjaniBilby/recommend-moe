import { UpdateUserMediaAffinity } from "@db/sql.ts";
import { RouteContext } from "htmx-router";
import { html } from "htmx-router/response";

import { GetUserID } from "~/model/user.ts";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ request, cookie, params, headers }: RouteContext<typeof parameters>) {
	headers.set("Cache-Control", "private");

	const userID = await GetUserID(request, cookie);
	if (!userID) return html(blank);

	const rating = await prisma.userMediaScore.findFirst({
		select: { affinity: true },
		where:  { mediaID: params.id, userID }
	});

	let affinity = rating?.affinity;
	if (!affinity) {
		const compute = await prisma.$queryRawTyped(UpdateUserMediaAffinity(userID, params.id));
		affinity = compute[0]?.affinity || null;
	}

	if (typeof affinity !== "number") return html(blank);

	affinity ||= 0;

	return `${(affinity*100).toFixed(2)}%`;
}

const blank = `&mdash; %`;