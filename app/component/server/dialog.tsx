import { RouteContext } from "htmx-router";
import { ReactNode } from "react";

import { Dialog } from "~/component/dialog.tsx";


export function DialogResponse(ctx: RouteContext | Headers, body: ReactNode) {
	const headers = ctx instanceof Headers ? ctx : ctx.headers;
	headers.set("hx-retarget", "body");
	headers.set("hx-reswap", "beforeend");
	headers.set("hx-push-url", "false");

	return <Dialog>{body}</Dialog>
}

export function AppendResponse(ctx: RouteContext | Headers, body: ReactNode) {
	const headers = ctx instanceof Headers ? ctx : ctx.headers;
	headers.set("hx-retarget", "body");
	headers.set("hx-reswap", "beforeend");
	headers.set("hx-push-url", "false");

	return body;
}