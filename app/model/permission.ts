import { CheckPermissionUser, CheckPermissionUserSession, GetUserPermissions } from "@db/sql.ts";
import { MakeStatus } from "htmx-router/status";
import { Permission } from "@db/enums.ts";
import { Cookies } from "htmx-router/cookies";
import { User } from "@db/client.ts";

import { EventTarget } from "~/model/event.ts";
import { GetUserID } from "~/model/user.ts";

import { GetSessionAuth, RefreshSession } from "~/session.ts";
import { CompareSortedSets } from "~/util/math.ts";
import { IsLetterMatching } from "~/util";
import { prisma } from "~/db.server.ts";

export const PERMISSION_DESCRIPTION: Record<Permission, string> = {
	// "ENV_MODIFY"     : "",
	"MEDIA_MODIFY"      : "",
	"PERMISSION_ASSIGN" : "",
	"USER_MODIFY"       : "",
} as const;
Object.freeze(PERMISSION_DESCRIPTION);

export function IsPermission(permission: string): permission is Permission {
	return permission in Permission;
}

export function ParsePermission(d: unknown): Permission {
	const p = String(d).toUpperCase();
	if (IsPermission(p)) return p;

	throw new Error(`Unrecognized permission ${p}`);
}

export async function CheckPermission(userID: User['id'] | null, permission: Permission) {
	if (userID === null) return false;

	const poll = await prisma.$queryRawTyped(CheckPermissionUser(permission, userID));
	if (poll.length < 1) return false;

	return poll[0].valid || false;
}

export async function GetPermissions(userID: User['id'] | null): Promise<Permission[]> {
	if (userID === null) return [];

	const raw = await prisma.$queryRawTyped(GetUserPermissions(userID));

	return raw.map(x => x.permission) as Permission[];
}

export async function SearchEntityPermissions(target: PermissionEntityTarget, query: string) {
	const existing = await GetEntityPermissions(target);
	if (!query && existing.length > 0) return existing.map(p => ({ permission: p, existing: true }));

	const keys = Object.keys(Permission) as Permission[];
	return keys.filter(p => IsLetterMatching(p, query.toUpperCase()))
		.map(p => ({
			permission: p,
			existing: existing.some(e => e === p)
		}));
}


export async function EnforcePermission(request: Request, cookies: Cookies, permission?: Permission) {
	if (!permission) {
		const userID = await GetUserID(request, cookies);
		if (!userID) throw new Response("Unauthorised Access", MakeStatus("Unauthorized"));

		return userID;
	}

	const auth = GetSessionAuth(request, cookies);
	if (!auth) throw new Response("Unauthorised Access", MakeStatus("Unauthorized"));

	const raw = await prisma.$queryRawTyped(CheckPermissionUserSession(permission, auth.prefix, auth.key, auth.ip));

	const session = raw[0];
	if (!session) throw new Response(`Forbidden, requires ${permission} permission`, MakeStatus("Forbidden"));

	RefreshSession(auth.prefix, session.expiry).catch(console.error);

	return session.userID;
}




export async function AttachPermission(permission: Permission, target: EventTarget, attach: boolean, authorID: number) {
	if (!await CheckPermission(authorID, permission)) throw new Error(`Cannot assign a permission which you don't have`);

	switch (target.kind) {
		case "User":   return AttachPermissionUser(permission, target.id, attach, authorID);
		case "Role":   return AttachPermissionRole(permission, target.id, attach, authorID);
	}

	throw new Error(`Cannot add permissions to ${target.kind}`);
}


async function AttachPermissionUser(permission: Permission, userID: number, attach: boolean, authorID: number) {
	// const permID = await GetPermissionID(permission);
	await prisma.$transaction(async (tx) => {
		const batch = attach
			? await tx.userPermission.createMany({ data: [{ permission, userID }]})
			: await tx.userPermission.deleteMany({ where: { permission, userID } });
		if (batch.count < 1) return;
		await tx.user.update({ where: { id: userID }, data: { updatedAt: new Date() }});

		// await EventAttach([
		// 	{ kind: "Permission", id: permID },
		// 	{ kind: "User",       id: userID }
		// ], attach, authorID);
	});

	return { success: true };
}


async function AttachPermissionRole(permission: Permission, roleID: number, attach: boolean, authorID: number) {
	if (!attach) {
		const count = await prisma.role.findFirst({
			select: { id: true },
			where: { id: roleID, name: "ADMIN" }
		});

		if (count !== null) throw new Error("Cannot remove permissions from the admin role");
	}

	// const permID = await GetPermissionID(permission);

	await prisma.$transaction(async (tx) => {
		const batch = attach
			? await tx.rolePermission.createMany({ data: [{ permission, roleID }]})
			: await tx.rolePermission.deleteMany({ where: { permission, roleID } });
		if (batch.count < 1) return;
		await tx.role.update({ where: { id: roleID }, data: { updatedAt: new Date() }});

		// await EventAttach([
		// 	{ kind: "Permission", id: permID },
		// 	{ kind: "Role",       id: roleID }
		// ], attach, authorID);
	});

	return { success: true };
}




type PermissionEntity = "User" | "Role";
type PermissionEntityTarget = { kind: PermissionEntity, id: number };
export async function GetEntityPermissions (target: PermissionEntityTarget) {
	const { kind, id } = target;
	let raw;
	switch (kind) {
		case "Role":   raw = await prisma.rolePermission.findMany({ select: { permission: true }, where: { roleID: id },  orderBy: { permission: "asc" }}); break;
		case "User":   raw = await prisma.$queryRawTyped(GetUserPermissions(id)) as { permission: Permission }[]; break;
	}

	return raw.map(x => x.permission);
}


export async function CompareEntityPermissionPowers (a: PermissionEntityTarget, b: PermissionEntityTarget) {
	const A = await GetEntityPermissions(a);
	const B = await GetEntityPermissions(b);

	const cmp = CompareSortedSets(A, B);
	return cmp;
}