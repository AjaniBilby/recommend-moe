import process from "node:process";
import { RouteContext } from "htmx-router";
import { randomBytes } from 'crypto';
import { redirect } from "htmx-router/response";

import { StartChallenge } from "~/session.ts";
import { CutString } from "~/util/format/text.ts";

export function loader({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private, no-store");

	const state = randomBytes(16).toString("hex");
	const challenge = StartChallenge(cookie).slice(0, 128);
	cookie.set("state", state.slice(0, 128));

	const CLIENT_ID = process.env.MAL_CLIENT_ID;
	if (!CLIENT_ID) throw new Error("Client ID is not defined");
	const MAL_CLIENT_SECRET = process.env.MAL_CLIENT_SECRET;
	if (!MAL_CLIENT_SECRET) throw new Error("Client Secrete is not defined");

	const to = new URL("https://myanimelist.net/v1/oauth2/authorize");
	to.searchParams.set("response_type", "code");
	to.searchParams.set("client_id", CLIENT_ID);
	to.searchParams.set("state", state);
	to.searchParams.set("code_challenge", challenge)
	to.searchParams.set("code_challenge_method", "plain");
	to.searchParams.set("redirect_uri", MakeURI(request));

	return redirect(to.toString());
}

export function MakeURI(request: Request) {
	const protocol = CutString(request.url, ":")[0];
	const hostname = request.headers.get('host') || "localhost";
	return protocol+"://"+hostname+"/login/mal/callback";
}