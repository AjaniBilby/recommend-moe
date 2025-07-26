import process from "node:process";
import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { text } from "htmx-router/response";

import { GetChallenge, StartChallenge } from "~/session.ts";
import { Buffer } from "node:buffer";

export async function loader({ url, cookie }: RouteContext) {
	if (url.searchParams.get("state") !== cookie.get("state")) throw new Response("Invalid state parameter", MakeStatus("Bad Request"));

	const code = url.searchParams.get("code");
	if (!code) throw new Response("OAuth did not provide code", MakeStatus("Bad Request"));

	const challenge = GetChallenge(cookie)?.slice(0, 128);
	if (!challenge) throw new Error("Timeout");

	const client_id = process.env.MAL_CLIENT_ID;
	if (!client_id) throw new Error("Client ID is not defined");
	const client_secret = process.env.MAL_CLIENT_SECRET;
	if (!client_secret) throw new Error("Client Secrete is not defined");

	const credentials = `${client_id}:${client_secret}`;

	const req = await fetch("https://myanimelist.net/v1/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${Buffer.from(credentials).toString("base64")}`,
		},
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code: code,
			code_verifier: challenge
		}),
	});

	if (!req.ok) throw new Error(await req.text());

	const tokens = await req.json();

	console.log(tokens);
	// cookie.unset("state");

	// const to = new URL("https://myanimelist.net/v1/oauth2/authorize");
	// to.searchParams.set("response_type", "code");
	// to.searchParams.set("client_id", CLIENT_ID);
	// to.searchParams.set("state", state);
	// to.searchParams.set("redirect_url", `http://localhost:8000/login/mal/callback`)
	// to.searchParams.set("code_challenge", challenge)
	// to.searchParams.set("code_challenge_method", "S256");

	return text("hi");
}