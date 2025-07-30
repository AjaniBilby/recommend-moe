import { RouteContext } from "htmx-router";
import { revalidate } from "htmx-router/response";

import { EnforcePermission } from "~/model/permission.ts";
import { prisma } from "~/db.server.ts";
import { RankNoveltyCommit } from "@db/sql.ts";

export async function action({ request, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "no-cache, no-store");
	await EnforcePermission(request, cookie, "MEDIA_MODIFY");

	await prisma.$queryRawTyped(RankNoveltyCommit());

	return revalidate();
}