import process from "node:process";
import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { Buffer } from "node:buffer";
import { text } from "htmx-router/response";

import { GetChallenge } from "~/session.ts";

export async function loader({ url, cookie }: RouteContext) {
	if (url.searchParams.get("state") !== cookie.get("state")) throw new Response("Invalid state parameter", MakeStatus("Bad Request"));

	const code = url.searchParams.get("code");
	if (!code) throw new Response("OAuth did not provide code", MakeStatus("Bad Request"));

	const challenge = GetChallenge(cookie)?.slice(0, 128);
	if (!challenge) throw new Error("Timeout");

	const tokens = await MakeToken(challenge, code);
	const user = await FetchUser(tokens);

	console.log(user);

	return text("hi");
}


type Token = { token_type: "Bearer", expires_in: number, access_token: string, refresh_token: string };
async function MakeToken(challenge: string, code: string): Promise<Token> {
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

	return await req.json();
}


async function FetchUser(token: Token): Promise<{ id: number, name: string }> {
	const req = await fetch("https://api.myanimelist.net/v2/users/@me", {
		headers: { Authorization: `Bearer ${token.access_token}` }
	});
	if (!req.ok) throw new Error(`Unable to load user information from MAL\n${await req.text()}`);

	return await req.json();
}