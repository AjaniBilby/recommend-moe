import { RouteContext } from "htmx-router";
import { randomBytes } from 'crypto';
import { redirect } from "htmx-router/response";

import { StartChallenge } from "~/session.ts";

export function loader({ cookie }: RouteContext) {
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
	// to.searchParams.set("redirect_uri", `https://localhost:8000/login/mal/callback`)
	to.searchParams.set("code_challenge", challenge)
	to.searchParams.set("code_challenge_method", "plain");

	return redirect(to.toString());
}