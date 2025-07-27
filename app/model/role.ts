import { Permission } from "@db/enums.ts";

import { prisma } from "~/db.server.ts";

export function InitRoles() {
	return Promise.all([
		SetupAdmin()
	]);
}

export type KnownRole = "ADMIN";
export function IsKnownRole(role: string): role is KnownRole {
	switch (role) {
		case "ADMIN": return true;
	}

	return false;
}

async function SetupAdmin() {
	let admin = await prisma.role.findUnique({
		select: { id: true },
		where: { name: "ADMIN" }
	});

	if (!admin) admin = await prisma.role.create({
		select: { id: true },
		data: {
			name: "ADMIN",
			description: "Has all permissions always"
		}
	})

	const linked = await prisma.rolePermission.createManyAndReturn({
		select: { permission: true },
		data: Object.keys(Permission).map(x => ({ roleID: admin.id, permission: x as Permission })),
		skipDuplicates: true
	});

	// const permissions = await prisma.$queryRawTyped(GetPermissionIDs(linked.map(x => x.permission)));
	// for (const perm of permissions) await EventAttach([
	// 	{ kind: "Role",       id: admin.id      },
	// 	{ kind: "Permission", id: perm.id || -1 }
	// ], true, null);

	// Mark admin as updated
	if (linked.length >= 0) await prisma.role.update({
		where: { id: admin.id },
		data:  { updatedAt: new Date() }
	});
}