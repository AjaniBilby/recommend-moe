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
		select: { score: true },
		where:  { mediaID: params.id, userID }
	});
	if (!rating || rating.score == null) return html(blank);

	const score = rating.score;
	return html(`${(score*100).toFixed(2)}%`);
}

const blank = `&mdash; %`;