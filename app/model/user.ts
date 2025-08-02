import { Cookies } from "htmx-router/cookies";

import { GetSessionAuth, RefreshSession } from "~/session.ts";
import { prisma } from "~/db.server.ts";
import { ExternalKind } from "@db/enums.ts";

export async function GetUserID(request: Request, cookies: Cookies): Promise<number | null> {
	const session = GetSessionAuth(request, cookies);
	if (!session) return null;

	// Check the sessionID is correct
	const found = await prisma.userSession.findFirst({
		select: { prefix: true, userID: true, expiry: true },
		where: {
			prefix: session.prefix,
			key:    session.key,
			ip:     session.ip,
			expiry: { gte: new Date() },
		}
	});
	if (!found) return null;

	RefreshSession(found.prefix, found.expiry).catch(console.error);

	return found.userID;
}

export async function InsertExternalUser(type: ExternalKind, id: string) {
	const external = await prisma.externalUser.findFirst({
		select: { userID: true },
		where:  { id, type }
	});
	if (external) return external.userID;

	const userID = await prisma.$transaction(async (tx) => {
		const slot = await tx.user.create({ data: {}});
		await tx.externalUser.create({ data: { userID: slot.id, type, id }})

		return slot.id;
	});

	return userID;
}


export async function OnboardMalUser(user: { id: number, name: string }) {
	const id = user.name.toLowerCase();
	const existing = await prisma.externalUser.findUnique({
		select: { userID: true },
		where:  { id }
	});
	if (existing) return existing.userID;

	const userID = await prisma.$transaction(async (tx) => {
		const slot = await tx.user.create({});
		await tx.externalUser.create({ data: {
			type: "MyAnimeList", id, userID: slot.id,
			data: { user_id: user.id, username: user.name }
		}});

		return slot.id;
	});

	if (!admin_present) AutoAdmin(userID).catch(console.error);

	return userID;
}


let admin_present = false;
async function AutoAdmin(userID: number) {
	const existing = await prisma.user.findFirst({
		select: { id: true },
		where: { roles: { some: { name: "ADMIN" }}}
	});
	if (existing) {
		admin_present = true;
		return false;
	}

	await prisma.user.update({
		where: { id: userID },
		data: { roles: { connect: { name: "ADMIN" }}}
	});
	admin_present = true;
	return true;
}