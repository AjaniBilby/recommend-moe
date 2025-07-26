import { Cookies, CookieOptions } from "htmx-router/cookies";
import { randomBytes } from 'crypto';

import { EncodeSecret, DecodeSecret } from "~/util/secret.ts";
import { isProduction } from "~/util/index.ts";
import { TIME_SCALE } from "~/util/time.ts";

// invariant(typeof process.env.SESSION_SECRET === "string", "SESSION_SECRET env var not set");

const sessionOptions: CookieOptions = {
	path: "/",
	httpOnly: true,
	sameSite: "lax",
	secure: isProduction,
	maxAge: 30 * TIME_SCALE.day
};


export function StartChallenge(cookies: Cookies) {
	const challenge = randomBytes(96).toString('base64url');

	cookies.set("c", EncodeSecret(challenge).replaceAll(":", "."), {
		...sessionOptions,
		maxAge: 60,
	});

	return challenge;
}

export function GetChallenge(cookies: Cookies) {
	const val = cookies.get("c");

	if (!val) return null;

	// clear challenge on read
	// cookies.set("c", "", { maxAge: 0, ...sessionOptions });

	return DecodeSecret(val.replaceAll(".", ":"));
}