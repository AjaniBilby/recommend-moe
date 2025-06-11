import { CSSProperties, ReactNode } from "react";
import { CSSProperties, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RouteContext } from "htmx-router";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import { ServerDialog } from "~/component/dialog";


export function DialogResponse(ctx: RouteContext | Headers, body: ReactNode) {
	const headers = ctx instanceof Headers ? ctx : ctx.headers;
	headers.set("hx-retarget", "body");
	headers.set("hx-reswap", "beforeend");
	headers.set("hx-push-url", "false");

	return <ServerDialog>{body}</ServerDialog>
}

export function AppendResponse(ctx: RouteContext | Headers, body: ReactNode) {
	const headers = ctx instanceof Headers ? ctx : ctx.headers;
	headers.set("hx-retarget", "body");
	headers.set("hx-reswap", "beforeend");
	headers.set("hx-push-url", "false");

	return body;
}