import { redirect } from "htmx-router/response";

export function loader() {
	return redirect("/rank/score");
}