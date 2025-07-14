import { RouteContext } from "htmx-router";
import { revalidate } from "htmx-router/response";

export function loader({ headers }: RouteContext) {
	headers.set("Cache-Control", "public, immutable");
	return revalidate({ headers });
}