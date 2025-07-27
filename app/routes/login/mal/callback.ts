import process from "node:process";
import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { redirect } from "htmx-router/response";
import { Buffer } from "node:buffer";

import { OnboardMalUser } from "~/model/user.ts";

import { CreateSession, GetChallenge } from "~/session.ts";
import { GetClientIPAddress } from "~/util/network.ts";
import { EncodeSecret } from "~/util/secret.ts";
import { TIME_SCALE } from "~/util/time.ts";
import { prisma } from "~/db.server.ts";

export async function loader({ request, url, cookie }: RouteContext) {
	if (url.searchParams.get("state") !== cookie.get("state")) throw new Response("Invalid state parameter", MakeStatus("Bad Request"));

	const code = url.searchParams.get("code");
	if (!code) throw new Response("OAuth did not provide code", MakeStatus("Bad Request"));

	const challenge = GetChallenge(cookie)?.slice(0, 128);
	if (!challenge) throw new Error("Timeout");

	const tokens = await MakeToken(challenge, code);
	cookie.unset("state");

	const expiry = new Date(Date.now() + tokens.expires_in * TIME_SCALE.second);
	const user = await FetchUser(tokens);

	const userID = await OnboardMalUser(user);

	await prisma.userAuthToken.create({ data: {
		type: "MyAnimeList",
		access: EncodeSecret(tokens.access_token),
		refresh: EncodeSecret(tokens.refresh_token),
		userID, expiry
	}});

	CreateSession(cookie, userID, GetClientIPAddress(request));

	return redirect("/");
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