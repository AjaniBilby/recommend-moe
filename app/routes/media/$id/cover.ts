import { RouteContext } from "htmx-router";
import { redirect } from "htmx-router/response";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		select: { icon: true },
		where: { id: params.id }
	});
	if (!media)      return null;
	if (!media.icon) return null;

	if (media.icon.startsWith("https://myanimelist.cdn-dena.com/")) return redirect("https://cdn.myanimelist.net/"+media.icon.slice("https://myanimelist.cdn-dena.com/".length));

	return redirect(media.icon);
}