import { RouteContext } from "htmx-router";
import { text } from "htmx-router/response";

export function loader({ headers }: RouteContext) {
	headers.set("Cache-Control", "public, immutable");
	return text("", { headers });
}