import { RouteContext } from "htmx-router";
import { text } from "htmx-router/response";

import { ReFetchMedia } from "~/model/media.ts";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	await ReFetchMedia(params.id);
	return text("ok");
}