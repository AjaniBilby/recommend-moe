import { RouteContext } from "htmx-router";
import { text } from "htmx-router/response";

import { ReIndexMedia } from "~/model/media.ts";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	await ReIndexMedia(params.id);
	return text("ok");
}