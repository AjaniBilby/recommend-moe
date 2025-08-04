import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ params, headers}: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		select: { icon: true },
		where: { id: params.id }
	});
	if (!media)      return null;
	if (!media.icon) return null;

	headers.set("Location", media.icon);
	return new Response("", MakeStatus("Permanent Redirect", headers));
}