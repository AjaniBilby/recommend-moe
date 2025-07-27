import { Cookies, CookieOptions } from "htmx-router/cookies";
import { randomBytes } from 'crypto';
import { Buffer } from "node:buffer";

import { EncodeSecret, DecodeSecret } from "~/util/secret.ts";
import { GetClientIPAddress } from "~/util/network.ts";
import { isProduction } from "~/util/index.ts";
import { TIME_SCALE } from "~/util/time.ts";
import { prisma } from "~/db.server.ts";

const SESSION_EXPIRY = 30 * TIME_SCALE.day;
const sessionOptions: CookieOptions = {
	path: "/",
	httpOnly: true,
	sameSite: "lax",
	secure: isProduction,
	maxAge: 30 * TIME_SCALE.day
};


export function GetSessionAuth(request: Request, cookies: Cookies) {
	const token = GetSessionToken(cookies);
	const ip = GetClientIPAddress(request);

	return { prefix: token.prefix, key: token.key, ip };
}

function GetSessionToken(cookies: Cookies) {
	return DecodeSessionToken(cookies.get("s"));
}


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

	cookies.unset("c"); // clear challenge on read

	return DecodeSecret(val.replaceAll(".", ":"));
}



export async function CreateSession(cookie: Cookies, userID: number, ip: string) {
	const buffer = randomBytes(40);
	cookie.set("s", buffer.toString("base64"), sessionOptions);

	const token = DecodeSessionToken(buffer.toString("base64"));

	await prisma.userSession.create({ data: {
		...token,
		userID, ip,
		expiry: new Date(Date.now()+SESSION_EXPIRY),
	}})

	return DecodeSessionToken(buffer.toString("base64"));
}


export function DecodeSessionToken(session: string | null) {
	if (session === null) return { prefix: 0, key: "" };

	const buffer = Buffer.from(session, "base64");
	if (buffer.byteLength < 5) return { prefix: 0, key: "" };

	const prefix = buffer.readInt32LE(0);
	const key = buffer.toString("base64", 4);

	return { prefix, key };
}




export async function RefreshSession(prefix: number, expiry: Date) {
	const remaining = expiry.getTime() - Date.now();
	const used = SESSION_EXPIRY - remaining;

	if (used < TIME_SCALE.hour) return;

	try {
		await prisma.userSession.update({
			select: { userID: true },
			where: { prefix },
			data:  { expiry: new Date(Date.now() + SESSION_EXPIRY) }
		});
	} catch (e) { console.error(e); }
}