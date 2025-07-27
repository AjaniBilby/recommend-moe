import { Cookies } from "htmx-router/cookies";
import { prisma } from "../db.server.ts";

export function GetUserID(request: Request, cookies: Cookies) {
	const user = cookies.get("userID");
	if (!user) return null;

	return Number(user) || null;
}



export async function OnboardMalUser(user: { id: number, name: string }) {
	const id = user.name.toLowerCase();
	const existing = await prisma.externalUser.findUnique({
		select: { userID: true },
		where:  { id }
	});
	if (existing) return existing.userID;

	return await prisma.$transaction(async (tx) => {
		const slot = await tx.user.create({});
		await tx.externalUser.create({ data: {
			type: "MyAnimeList", id, userID: slot.id,
			data: { user_id: user.id, username: user.name }
		}});

		return slot.id;
	});
}